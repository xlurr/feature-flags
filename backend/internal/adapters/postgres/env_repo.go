package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xlurr/ff-manager/internal/domain"
)

type EnvRepo struct{ db *pgxpool.Pool }

func NewEnvRepo(db *pgxpool.Pool) *EnvRepo { return &EnvRepo{db: db} }

func (r *EnvRepo) GetByProject(ctx context.Context, projectID string) ([]domain.Environment, error) {
	const q = `SELECT id::text,project_id::text,env_key,name,client_api_key,created_at
		FROM environments WHERE project_id=$1::uuid ORDER BY created_at`
	rows, err := r.db.Query(ctx, q, projectID)
	if err != nil {
		return nil, fmt.Errorf("EnvRepo.GetByProject: %w", err)
	}
	defer rows.Close()
	var envs []domain.Environment
	for rows.Next() {
		var e domain.Environment
		if err := rows.Scan(&e.ID, &e.ProjectID, &e.EnvKey, &e.Name, &e.ClientAPIKey, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("EnvRepo.GetByProject scan: %w", err)
		}
		envs = append(envs, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("EnvRepo.GetByProject rows: %w", err)
	}
	if envs == nil {
		envs = []domain.Environment{}
	}
	return envs, nil
}

func (r *EnvRepo) GetByAPIKey(ctx context.Context, apiKey string) (*domain.Environment, error) {
	const q = `SELECT id::text,project_id::text,env_key,name,client_api_key,created_at
		FROM environments WHERE client_api_key=$1 LIMIT 1`
	var e domain.Environment
	if err := r.db.QueryRow(ctx, q, apiKey).Scan(
		&e.ID, &e.ProjectID, &e.EnvKey, &e.Name, &e.ClientAPIKey, &e.CreatedAt); err != nil {
		return nil, fmt.Errorf("EnvRepo.GetByAPIKey: %w", err)
	}
	return &e, nil
}
