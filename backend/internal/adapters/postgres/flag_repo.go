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

type FlagRepo struct{ db *pgxpool.Pool }

func NewFlagRepo(db *pgxpool.Pool) *FlagRepo { return &FlagRepo{db: db} }

func (r *FlagRepo) GetFlags(ctx context.Context, projectID string) ([]domain.FlagWithStates, error) {
	const query = `
		SELECT
			f.id::text, f.project_id::text,
			COALESCE(f.author_id::text,'') AS author_id,
			f.flag_key, f.name, f.description, f.is_permanent,
			f.created_at, f.updated_at,
			COALESCE(u.full_name,'') AS author_name,
			e.id::text AS env_id, e.env_key,
			COALESCE(fs.id::text,'') AS state_id,
			COALESCE(fs.is_enabled,false) AS is_enabled,
			COALESCE(fs.targeting_rules,'[]'::jsonb) AS targeting_rules,
			COALESCE(fs.rollout_weight,100) AS rollout_weight,
			COALESCE(fs.updated_at,f.updated_at) AS state_updated_at
		FROM feature_flags f
		LEFT  JOIN users       u  ON u.id = f.author_id
		CROSS JOIN environments e
		LEFT  JOIN flag_states  fs ON fs.flag_id = f.id AND fs.environment_id = e.id
		WHERE f.project_id = $1::uuid
		  AND e.project_id = $1::uuid
		  AND f.archived_at IS NULL
		ORDER BY f.created_at DESC, e.env_key`

	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		return nil, fmt.Errorf("FlagRepo.GetFlags: %w", err)
	}
	defer rows.Close()

	flagMap := make(map[string]*domain.FlagWithStates)
	var order []string

	for rows.Next() {
		var (
			fID, fProjectID, fAuthorID, fFlagKey, fName, fDesc string
			fIsPermanent                                        bool
			fCreatedAt, fUpdatedAt                             time.Time
			fAuthorName, envID, envKey, stateID                string
			isEnabled                                          bool
			targetingRaw                                       []byte
			rolloutWeight                                      int
			stateUpdatedAt                                     time.Time
		)
		if err := rows.Scan(&fID, &fProjectID, &fAuthorID, &fFlagKey, &fName, &fDesc,
			&fIsPermanent, &fCreatedAt, &fUpdatedAt, &fAuthorName,
			&envID, &envKey, &stateID, &isEnabled, &targetingRaw,
			&rolloutWeight, &stateUpdatedAt); err != nil {
			return nil, fmt.Errorf("FlagRepo.GetFlags scan: %w", err)
		}
		if _, ok := flagMap[fID]; !ok {
			flagMap[fID] = &domain.FlagWithStates{
				FeatureFlag: domain.FeatureFlag{
					ID: fID, ProjectID: fProjectID, AuthorID: fAuthorID,
					FlagKey: fFlagKey, Name: fName, Description: fDesc,
					IsPermanent: fIsPermanent, CreatedAt: fCreatedAt, UpdatedAt: fUpdatedAt,
				},
				AuthorName: fAuthorName,
				States:     make(map[string]domain.FlagState),
			}
			order = append(order, fID)
		}
		if stateID != "" {
			var rules []domain.TargetingRule
			_ = json.Unmarshal(targetingRaw, &rules)
			if rules == nil {
				rules = []domain.TargetingRule{}
			}
			flagMap[fID].States[envKey] = domain.FlagState{
				ID: stateID, FlagID: fID, EnvironmentID: envID,
				IsEnabled: isEnabled, TargetingRules: rules,
				RolloutWeight: rolloutWeight, UpdatedAt: stateUpdatedAt,
			}
		}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("FlagRepo.GetFlags rows: %w", err)
	}
	result := make([]domain.FlagWithStates, 0, len(order))
	for _, id := range order {
		result = append(result, *flagMap[id])
	}
	return result, nil
}

func (r *FlagRepo) GetFlag(ctx context.Context, id string) (*domain.FlagWithStates, error) {
	const query = `
		SELECT
			f.id::text, f.project_id::text,
			COALESCE(f.author_id::text,'') AS author_id,
			f.flag_key, f.name, f.description, f.is_permanent,
			f.created_at, f.updated_at,
			COALESCE(u.full_name,'') AS author_name,
			e.id::text AS env_id, e.env_key,
			COALESCE(fs.id::text,'') AS state_id,
			COALESCE(fs.is_enabled,false) AS is_enabled,
			COALESCE(fs.targeting_rules,'[]'::jsonb) AS targeting_rules,
			COALESCE(fs.rollout_weight,100) AS rollout_weight,
			COALESCE(fs.updated_at,f.updated_at) AS state_updated_at
		FROM feature_flags f
		LEFT  JOIN users       u  ON u.id = f.author_id
		CROSS JOIN environments e
		LEFT  JOIN flag_states  fs ON fs.flag_id = f.id AND fs.environment_id = e.id
		WHERE f.id = $1::uuid AND e.project_id = f.project_id
		ORDER BY e.env_key`

	rows, err := r.db.Query(ctx, query, id)
	if err != nil {
		return nil, fmt.Errorf("FlagRepo.GetFlag: %w", err)
	}
	defer rows.Close()

	var result *domain.FlagWithStates
	for rows.Next() {
		var (
			fID, fProjectID, fAuthorID, fFlagKey, fName, fDesc string
			fIsPermanent                                        bool
			fCreatedAt, fUpdatedAt                             time.Time
			fAuthorName, envID, envKey, stateID                string
			isEnabled                                          bool
			targetingRaw                                       []byte
			rolloutWeight                                      int
			stateUpdatedAt                                     time.Time
		)
		if err := rows.Scan(&fID, &fProjectID, &fAuthorID, &fFlagKey, &fName, &fDesc,
			&fIsPermanent, &fCreatedAt, &fUpdatedAt, &fAuthorName,
			&envID, &envKey, &stateID, &isEnabled, &targetingRaw,
			&rolloutWeight, &stateUpdatedAt); err != nil {
			return nil, fmt.Errorf("FlagRepo.GetFlag scan: %w", err)
		}
		if result == nil {
			result = &domain.FlagWithStates{
				FeatureFlag: domain.FeatureFlag{
					ID: fID, ProjectID: fProjectID, AuthorID: fAuthorID,
					FlagKey: fFlagKey, Name: fName, Description: fDesc,
					IsPermanent: fIsPermanent, CreatedAt: fCreatedAt, UpdatedAt: fUpdatedAt,
				},
				AuthorName: fAuthorName,
				States:     make(map[string]domain.FlagState),
			}
		}
		if stateID != "" {
			var rules []domain.TargetingRule
			_ = json.Unmarshal(targetingRaw, &rules)
			if rules == nil {
				rules = []domain.TargetingRule{}
			}
			result.States[envKey] = domain.FlagState{
				ID: stateID, FlagID: fID, EnvironmentID: envID,
				IsEnabled: isEnabled, TargetingRules: rules,
				RolloutWeight: rolloutWeight, UpdatedAt: stateUpdatedAt,
			}
		}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("FlagRepo.GetFlag rows: %w", err)
	}
	if result == nil {
		return nil, fmt.Errorf("FlagRepo.GetFlag: not found: %s", id)
	}
	return result, nil
}

func (r *FlagRepo) CreateFlag(ctx context.Context, flag *domain.FeatureFlag) error {
	if flag.ID == "" {
		flag.ID = uuid.New().String()
	}
	now := time.Now()
	flag.CreatedAt, flag.UpdatedAt = now, now
	const query = `
		INSERT INTO feature_flags
			(id, project_id, author_id, flag_key, name, description, is_permanent, created_at, updated_at)
		VALUES ($1, $2::uuid, NULLIF($3,'')::uuid, $4, $5, $6, $7, $8, $9)`
	_, err := r.db.Exec(ctx, query,
		flag.ID, flag.ProjectID, flag.AuthorID, flag.FlagKey,
		flag.Name, flag.Description, flag.IsPermanent, flag.CreatedAt, flag.UpdatedAt)
	if err != nil {
		return fmt.Errorf("FlagRepo.CreateFlag: %w", err)
	}
	return nil
}

func (r *FlagRepo) DeleteFlag(ctx context.Context, id string) error {
	if _, err := r.db.Exec(ctx, `DELETE FROM feature_flags WHERE id = $1::uuid`, id); err != nil {
		return fmt.Errorf("FlagRepo.DeleteFlag: %w", err)
	}
	return nil
}
