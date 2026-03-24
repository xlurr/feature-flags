package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xlurr/ff-manager/internal/domain"
)

type FlagStateRepo struct{ db *pgxpool.Pool }

func NewFlagStateRepo(db *pgxpool.Pool) *FlagStateRepo { return &FlagStateRepo{db: db} }

func (r *FlagStateRepo) GetState(ctx context.Context, flagID, envID string) (*domain.FlagState, error) {
	const q = `SELECT id::text, flag_id::text, environment_id::text,
		is_enabled, targeting_rules, rollout_weight, updated_at
		FROM flag_states WHERE flag_id=$1::uuid AND environment_id=$2::uuid`
	var id, fFlagID, fEnvID string
	var isEnabled bool
	var raw []byte
	var rw int
	var ua time.Time
	if err := r.db.QueryRow(ctx, q, flagID, envID).Scan(&id, &fFlagID, &fEnvID, &isEnabled, &raw, &rw, &ua); err != nil {
		return nil, fmt.Errorf("FlagStateRepo.GetState: %w", err)
	}
	return r.build(id, fFlagID, fEnvID, isEnabled, raw, rw, ua), nil
}

func (r *FlagStateRepo) ToggleState(ctx context.Context, flagID, envID string) (*domain.FlagState, error) {
	const q = `
		INSERT INTO flag_states (id, flag_id, environment_id, is_enabled, targeting_rules, rollout_weight, updated_at)
		VALUES ($1, $2::uuid, $3::uuid, true, '[]'::jsonb, 100, NOW())
		ON CONFLICT (flag_id, environment_id) DO UPDATE
			SET is_enabled = NOT flag_states.is_enabled, updated_at = NOW()
		RETURNING id::text, flag_id::text, environment_id::text,
		          is_enabled, targeting_rules, rollout_weight, updated_at`
	var id, fFlagID, fEnvID string
	var isEnabled bool
	var raw []byte
	var rw int
	var ua time.Time
	if err := r.db.QueryRow(ctx, q, uuid.New().String(), flagID, envID).Scan(
		&id, &fFlagID, &fEnvID, &isEnabled, &raw, &rw, &ua); err != nil {
		return nil, fmt.Errorf("FlagStateRepo.ToggleState: %w", err)
	}
	return r.build(id, fFlagID, fEnvID, isEnabled, raw, rw, ua), nil
}

func (r *FlagStateRepo) UpsertState(ctx context.Context, state *domain.FlagState) error {
	if state.ID == "" {
		state.ID = uuid.New().String()
	}
	state.UpdatedAt = time.Now()
	rulesJSON, err := json.Marshal(state.TargetingRules)
	if err != nil {
		return fmt.Errorf("FlagStateRepo.UpsertState marshal: %w", err)
	}
	const q = `
		INSERT INTO flag_states (id, flag_id, environment_id, is_enabled, targeting_rules, rollout_weight, updated_at)
		VALUES ($1, $2::uuid, $3::uuid, $4, $5::jsonb, $6, $7)
		ON CONFLICT (flag_id, environment_id) DO UPDATE
			SET is_enabled=EXCLUDED.is_enabled, targeting_rules=EXCLUDED.targeting_rules,
			    rollout_weight=EXCLUDED.rollout_weight, updated_at=EXCLUDED.updated_at`
	_, err = r.db.Exec(ctx, q, state.ID, state.FlagID, state.EnvironmentID,
		state.IsEnabled, rulesJSON, state.RolloutWeight, state.UpdatedAt)
	if err != nil {
		return fmt.Errorf("FlagStateRepo.UpsertState: %w", err)
	}
	return nil
}

func (r *FlagStateRepo) build(id, flagID, envID string, isEnabled bool, raw []byte, rw int, ua time.Time) *domain.FlagState {
	var rules []domain.TargetingRule
	_ = json.Unmarshal(raw, &rules)
	if rules == nil {
		rules = []domain.TargetingRule{}
	}
	return &domain.FlagState{ID: id, FlagID: flagID, EnvironmentID: envID,
		IsEnabled: isEnabled, TargetingRules: rules, RolloutWeight: rw, UpdatedAt: ua}
}
