package ports

import (
	"context"

	"github.com/xlurr/ff-manager/internal/domain"
)

// FlagService - интерфейс бизнес-логики флагов
type FlagService interface {
	ListFlags(ctx context.Context, projectID string) ([]domain.FlagWithStates, error)
	GetFlag(ctx context.Context, id string) (*domain.FlagWithStates, error)
	CreateFlag(ctx context.Context, projectID, flagKey, name, description string) (*domain.FeatureFlag, error)
	DeleteFlag(ctx context.Context, id string) error
	ToggleFlag(ctx context.Context, flagID, envID string) (*domain.FlagState, error)
	EvaluateFlags(ctx context.Context, apiKey string) (map[string]bool, error)
}

// AuditService - интерфейс бизнес-логики аудита
type AuditService interface {
	GetEvents(ctx context.Context, limit int) ([]domain.AuditEventFull, error)
	LogEvent(ctx context.Context, event *domain.AuditEvent) error
}

// DashboardService - интерфейс дашборда
type DashboardService interface {
	GetStats(ctx context.Context, projectID string) (*domain.DashboardStats, error)
}
