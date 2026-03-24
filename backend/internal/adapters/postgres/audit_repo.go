package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xlurr/ff-manager/internal/domain"
)

type AuditRepo struct{ db *pgxpool.Pool }

func NewAuditRepo(db *pgxpool.Pool) *AuditRepo { return &AuditRepo{db: db} }

func (r *AuditRepo) GetEvents(ctx context.Context, limit int) ([]domain.AuditEventFull, error) {
	const q = `
		SELECT ae.id::text,
			COALESCE(ae.flag_id::text,''), COALESCE(ae.actor_id::text,''),
			COALESCE(ae.environment_id::text,''),
			ae.event_type, ae.diff_payload, ae.created_at,
			COALESCE(u.full_name,'System'), COALESCE(f.flag_key,''), COALESCE(e.env_key,'')
		FROM audit_events ae
		LEFT JOIN users         u ON u.id = ae.actor_id
		LEFT JOIN feature_flags f ON f.id = ae.flag_id
		LEFT JOIN environments  e ON e.id = ae.environment_id
		ORDER BY ae.created_at DESC LIMIT $1`
	rows, err := r.db.Query(ctx, q, limit)
	if err != nil {
		return nil, fmt.Errorf("AuditRepo.GetEvents: %w", err)
	}
	defer rows.Close()
	var events []domain.AuditEventFull
	for rows.Next() {
		var eID, eFlagID, eActorID, eEnvID, eType string
		var diffRaw []byte
		var createdAt time.Time
		var actorName, flagKey, envKey string
		if err := rows.Scan(&eID, &eFlagID, &eActorID, &eEnvID, &eType, &diffRaw,
			&createdAt, &actorName, &flagKey, &envKey); err != nil {
			return nil, fmt.Errorf("AuditRepo.GetEvents scan: %w", err)
		}
		diff := "{}"
		if len(diffRaw) > 0 {
			diff = string(diffRaw)
		}
		events = append(events, domain.AuditEventFull{
			AuditEvent: domain.AuditEvent{ID: eID, FlagID: eFlagID, ActorID: eActorID,
				EnvironmentID: eEnvID, EventType: eType, DiffPayload: diff, CreatedAt: createdAt},
			ActorName: actorName, FlagKey: flagKey, EnvKey: envKey,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("AuditRepo.GetEvents rows: %w", err)
	}
	if events == nil {
		events = []domain.AuditEventFull{}
	}
	return events, nil
}

func (r *AuditRepo) CreateEvent(ctx context.Context, event *domain.AuditEvent) error {
	if event.ID == "" {
		event.ID = uuid.New().String()
	}
	event.CreatedAt = time.Now()
	diffJSON := []byte(event.DiffPayload)
	if len(diffJSON) == 0 {
		diffJSON = []byte("{}")
	}
	const q = `INSERT INTO audit_events (id,flag_id,actor_id,environment_id,event_type,diff_payload,created_at)
		VALUES ($1,NULLIF($2,'')::uuid,NULLIF($3,'')::uuid,NULLIF($4,'')::uuid,$5,$6::jsonb,$7)`
	if _, err := r.db.Exec(ctx, q, event.ID, event.FlagID, event.ActorID,
		event.EnvironmentID, event.EventType, diffJSON, event.CreatedAt); err != nil {
		return fmt.Errorf("AuditRepo.CreateEvent: %w", err)
	}
	return nil
}
