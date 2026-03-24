package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xlurr/ff-manager/internal/domain"
)

type ProjectRepo struct{ db *pgxpool.Pool }

func NewProjectRepo(db *pgxpool.Pool) *ProjectRepo { return &ProjectRepo{db: db} }

func (r *ProjectRepo) GetProjects(ctx context.Context) ([]domain.Project, error) {
	rows, err := r.db.Query(ctx, `SELECT id::text,project_key,name,description,created_at FROM projects ORDER BY created_at`)
	if err != nil {
		return nil, fmt.Errorf("ProjectRepo.GetProjects: %w", err)
	}
	defer rows.Close()
	var projects []domain.Project
	for rows.Next() {
		var p domain.Project
		if err := rows.Scan(&p.ID, &p.ProjectKey, &p.Name, &p.Description, &p.CreatedAt); err != nil {
			return nil, fmt.Errorf("ProjectRepo.GetProjects scan: %w", err)
		}
		projects = append(projects, p)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ProjectRepo.GetProjects rows: %w", err)
	}
	if projects == nil {
		projects = []domain.Project{}
	}
	return projects, nil
}

func (r *ProjectRepo) GetProject(ctx context.Context, id string) (*domain.Project, error) {
	var p domain.Project
	if err := r.db.QueryRow(ctx,
		`SELECT id::text,project_key,name,description,created_at FROM projects WHERE id=$1::uuid`, id,
	).Scan(&p.ID, &p.ProjectKey, &p.Name, &p.Description, &p.CreatedAt); err != nil {
		return nil, fmt.Errorf("ProjectRepo.GetProject: %w", err)
	}
	return &p, nil
}

func (r *ProjectRepo) CreateProject(ctx context.Context, project *domain.Project) error {
	if project.ID == "" {
		project.ID = uuid.New().String()
	}
	project.CreatedAt = time.Now()
	const q = `INSERT INTO projects (id,project_key,name,description,created_at) VALUES ($1,$2,$3,$4,$5)`
	if _, err := r.db.Exec(ctx, q, project.ID, project.ProjectKey,
		project.Name, project.Description, project.CreatedAt); err != nil {
		return fmt.Errorf("ProjectRepo.CreateProject: %w", err)
	}
	return nil
}
