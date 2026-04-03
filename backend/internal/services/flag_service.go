package services

import (
	"context"
	"encoding/json"
	"fmt"
	"hash/crc32"
	"log/slog"

	"github.com/google/uuid"
	"github.com/xlurr/ff-manager/internal/domain"
	"github.com/xlurr/ff-manager/internal/ports"
)

type FlagService struct {
	flags    ports.FlagRepository
	states   ports.FlagStateRepository
	envs     ports.EnvironmentRepository
	audit    ports.AuditRepository
	cache    EvalCache
	eventBus *EventBus
	logger   *slog.Logger // pointer — как возвращает slog.New()
}

func NewFlagService(
	flags ports.FlagRepository,
	states ports.FlagStateRepository,
	envs ports.EnvironmentRepository,
	audit ports.AuditRepository,
	cache EvalCache,
	eventBus *EventBus,
	logger *slog.Logger,
) *FlagService {
	return &FlagService{
		flags:    flags,
		states:   states,
		envs:     envs,
		audit:    audit,
		cache:    cache,
		eventBus: eventBus,
		logger:   logger,
	}
}

func (s *FlagService) ListFlags(ctx context.Context, projectID string) ([]domain.FlagWithStates, error) {
	return s.flags.GetFlags(ctx, projectID)
}

// GetFlag: port требует *FlagWithStates — возвращаем напрямую из репозитория.
func (s *FlagService) GetFlag(ctx context.Context, id string) (*domain.FlagWithStates, error) {
	return s.flags.GetFlag(ctx, id)
}

func (s *FlagService) ListEnvironments(ctx context.Context, projectID string) ([]domain.Environment, error) {
	return s.envs.GetByProject(ctx, projectID)
}

// CreateFlag: порт требует *FeatureFlag в возврате → возвращаем &flag.
func (s *FlagService) CreateFlag(ctx context.Context, projectID, flagKey, name, description string) (*domain.FeatureFlag, error) {
	flag := domain.FeatureFlag{
		ID:          uuid.New().String(),
		ProjectID:   projectID,
		FlagKey:     flagKey,
		Name:        name,
		Description: description,
		IsPermanent: false,
	}
	if err := s.flags.CreateFlag(ctx, &flag); err != nil {
		return nil, fmt.Errorf("FlagService.CreateFlag: %w", err)
	}

	envList, err := s.envs.GetByProject(ctx, projectID)
	if err != nil {
		return nil, fmt.Errorf("FlagService.CreateFlag get envs: %w", err)
	}
	for _, env := range envList {
		st := domain.FlagState{
			ID:             uuid.New().String(),
			FlagID:         flag.ID,
			EnvironmentID:  env.ID,
			IsEnabled:      false,
			TargetingRules: []domain.TargetingRule{},
			RolloutWeight:  100,
		}
		if err := s.states.UpsertState(ctx, &st); err != nil {
			s.logger.Warn("FlagService.CreateFlag upsert state failed",
				slog.String("env", env.EnvKey), slog.Any("err", err))
		}
		s.cache.InvalidateByEnv(ctx, env.ID)
	}

	diff, _ := json.Marshal(map[string]string{"action": "created", "flagkey": flagKey})
	s.audit.CreateEvent(ctx, &domain.AuditEvent{ //nolint:errcheck
		FlagID:      flag.ID,
		EventType:   "CREATE",
		DiffPayload: string(diff),
	})

	// Pattern #7: post-action hook
	go s.eventBus.Publish(projectID, SSEEvent{
		Type:      "CREATE",
		ProjectID: projectID,
		FlagID:    flag.ID,
	})

	return &flag, nil
}

func (s *FlagService) DeleteFlag(ctx context.Context, id string) error {
	existing, err := s.flags.GetFlag(ctx, id)
	if err != nil {
		return fmt.Errorf("FlagService.DeleteFlag get: %w", err)
	}
	for _, st := range existing.States {
		s.cache.InvalidateByEnv(ctx, st.EnvironmentID)
	}
	if err := s.flags.DeleteFlag(ctx, id); err != nil {
		return fmt.Errorf("FlagService.DeleteFlag: %w", err)
	}

	diff, _ := json.Marshal(map[string]string{"action": "deleted", "flagkey": existing.FlagKey})
	s.audit.CreateEvent(ctx, &domain.AuditEvent{ //nolint:errcheck
		FlagID:      id,
		EventType:   "DELETE",
		DiffPayload: string(diff),
	})

	projectID := existing.ProjectID
	go s.eventBus.Publish(projectID, SSEEvent{
		Type:      "DELETE",
		ProjectID: projectID,
		FlagID:    id,
	})

	return nil
}

// ToggleFlag: repo возвращает *FlagState → разыменовываем для интерфейса (value).
func (s *FlagService) ToggleFlag(ctx context.Context, flagID, envID string) (*domain.FlagState, error) {
	state, err := s.states.ToggleState(ctx, flagID, envID)
	if err != nil {
		return nil, fmt.Errorf("FlagService.ToggleFlag: %w", err)
	}
	s.cache.InvalidateByEnv(ctx, envID)

	action := "disabled"
	if state.IsEnabled {
		action = "enabled"
	}
	diff, _ := json.Marshal(map[string]string{"action": action, "flagid": flagID, "envid": envID})
	s.audit.CreateEvent(ctx, &domain.AuditEvent{ //nolint:errcheck
		FlagID:        flagID,
		EnvironmentID: envID,
		EventType:     "TOGGLE",
		DiffPayload:   string(diff),
	})

	// Явные параметры в горутине — безопасный capture (не closure over loop vars)
	go func(fid, eid string) {
		if flag, err := s.flags.GetFlag(context.Background(), fid); err == nil {
			s.eventBus.Publish(flag.ProjectID, SSEEvent{
				Type:      "TOGGLE",
				ProjectID: flag.ProjectID,
				FlagID:    fid,
				EnvID:     eid,
				Payload:   action,
			})
		}
	}(flagID, envID)

	return state, nil
}

func (s *FlagService) EvaluateFlags(ctx context.Context, apiKey string) (map[string]bool, error) {
	if cached, ok := s.cache.Get(ctx, apiKey); ok {
		s.logger.Info("eval cache hit", slog.String("apiKey", apiKey))
		return cached, nil
	}

	env, err := s.envs.GetByAPIKey(ctx, apiKey)
	if err != nil {
		return nil, domain.ErrInvalidAPIKey
	}
	flags, err := s.flags.GetFlags(ctx, env.ProjectID)
	if err != nil {
		return nil, fmt.Errorf("FlagService.EvaluateFlags: %w", err)
	}

	result := make(map[string]bool, len(flags))
	for _, f := range flags {
		st, ok := f.States[env.EnvKey]
		if !ok {
			result[f.FlagKey] = false
			continue
		}
		result[f.FlagKey] = evaluateState(st)
	}

	s.cache.Set(ctx, apiKey, env.ID, env.ProjectID, result)
	s.logger.Info("eval cache miss",
		slog.String("apiKey", apiKey),
		slog.Int("flags", len(result)))
	return result, nil
}

func evaluateState(state domain.FlagState) bool {
	if !state.IsEnabled {
		return false
	}
	if state.RolloutWeight >= 100 {
		return true
	}
	h := crc32.ChecksumIEEE([]byte(state.FlagID))
	return int(h%100) < state.RolloutWeight
}
