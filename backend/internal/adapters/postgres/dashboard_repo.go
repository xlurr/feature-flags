package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xlurr/ff-manager/internal/domain"
)

type DashboardRepo struct {
	db        *pgxpool.Pool
	auditRepo *AuditRepo
}

func NewDashboardRepo(db *pgxpool.Pool, auditRepo *AuditRepo) *DashboardRepo {
	return &DashboardRepo{db: db, auditRepo: auditRepo}
}

func (r *DashboardRepo) GetStats(ctx context.Context, projectID string) (*domain.DashboardStats, error) {
	const statsQ = `
		WITH
		  flag_count AS (
		    SELECT COUNT(*) AS total FROM feature_flags
		    WHERE project_id=$1::uuid AND archived_at IS NULL
		  ),
		  active_in_prod AS (
		    SELECT COUNT(*) AS active FROM flag_states fs
		    JOIN environments e ON e.id=fs.environment_id
		    WHERE e.project_id=$1::uuid AND e.env_key='production' AND fs.is_enabled=true
		  ),
		  audit_count AS (
		    SELECT COUNT(*) AS total FROM audit_events ae
		    JOIN feature_flags ff ON ff.id=ae.flag_id
		    WHERE ff.project_id=$1::uuid
		  )
		SELECT (SELECT total FROM flag_count),
		       (SELECT active FROM active_in_prod),
		       (SELECT total FROM audit_count)`

	var totalFlags, activeInProd, auditCount int
	if err := r.db.QueryRow(ctx, statsQ, projectID).Scan(&totalFlags, &activeInProd, &auditCount); err != nil {
		return nil, fmt.Errorf("DashboardRepo.GetStats: %w", err)
	}

	const envQ = `
SELECT
  e.env_key,
  e.name,
  COUNT(CASE WHEN fs.is_enabled THEN 1 END)::int AS active_count,
  (SELECT COUNT(*) FROM feature_flags
     WHERE project_id = $1::uuid AND archived_at IS NULL)::int AS total_count
FROM environments e
LEFT JOIN flag_states fs ON fs.environment_id = e.id
WHERE e.project_id = $1::uuid
GROUP BY e.id, e.env_key, e.name
ORDER BY e.created_at`

	rows, err := r.db.Query(ctx, envQ, projectID)
	if err != nil {
		return nil, fmt.Errorf("DashboardRepo.GetStats envQ: %w", err)
	}
	defer rows.Close()
	var envStats []domain.EnvStat
	for rows.Next() {
		var es domain.EnvStat
		if err := rows.Scan(&es.EnvKey, &es.Name, &es.ActiveCount, &es.TotalCount); err != nil {
			return nil, fmt.Errorf("DashboardRepo.GetStats envQ scan: %w", err)
		}
		envStats = append(envStats, es)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("DashboardRepo.GetStats envQ rows: %w", err)
	}
	if envStats == nil {
		envStats = []domain.EnvStat{}
	}
	recentAudit, err := r.auditRepo.GetEvents(ctx, 5)
	if err != nil {
		return nil, fmt.Errorf("DashboardRepo.GetStats recentAudit: %w", err)
	}
	return &domain.DashboardStats{
		TotalFlags: totalFlags, ActiveInProduction: activeInProd,
		AuditEventsCount: auditCount, EnvStats: envStats, RecentAudit: recentAudit,
	}, nil
}
