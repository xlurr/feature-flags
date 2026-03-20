package ports

import (
	"context"

	"github.com/xlurr/ff-manager/internal/domain"
)

// FlagRepository - порт для работы с feature flags
type FlagRepository interface {
	GetFlags(ctx context.Context, projectID string) ([]domain.FlagWithStates, error)
	GetFlag(ctx context.Context, id string) (*domain.FlagWithStates, error)
	CreateFlag(ctx context.Context, flag *domain.FeatureFlag) error
	DeleteFlag(ctx context.Context, id string) error
}

// FlagStateRepository - порт для работы с состояниями флагов
type FlagStateRepository interface {
	GetState(ctx context.Context, flagID, envID string) (*domain.FlagState, error)
	ToggleState(ctx context.Context, flagID, envID string) (*domain.FlagState, error)
	UpsertState(ctx context.Context, state *domain.FlagState) error
}

// AuditRepository - порт для журнала аудита
type AuditRepository interface {
	GetEvents(ctx context.Context, limit int) ([]domain.AuditEventFull, error)
	CreateEvent(ctx context.Context, event *domain.AuditEvent) error
}

// UserRepository - порт для пользователей
type UserRepository interface {
	GetUser(ctx context.Context, id string) (*domain.User, error)
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	GetUsers(ctx context.Context) ([]domain.User, error)
	CreateUser(ctx context.Context, user *domain.User) error
}

// ProjectRepository - порт для проектов
type ProjectRepository interface {
	GetProjects(ctx context.Context) ([]domain.Project, error)
	GetProject(ctx context.Context, id string) (*domain.Project, error)
	CreateProject(ctx context.Context, project *domain.Project) error
}

// EnvironmentRepository - порт для окружений
type EnvironmentRepository interface {
	GetByProject(ctx context.Context, projectID string) ([]domain.Environment, error)
	GetByAPIKey(ctx context.Context, apiKey string) (*domain.Environment, error)
}

// DashboardRepository - порт для дашборда
type DashboardRepository interface {
	GetStats(ctx context.Context, projectID string) (*domain.DashboardStats, error)
}
