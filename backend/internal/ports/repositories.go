package ports

import (
	"context"

	"github.com/xlurr/ff-manager/internal/domain"
)

type FlagRepository interface {
	GetFlags(ctx context.Context, projectID string) ([]domain.FlagWithStates, error)
	GetFlag(ctx context.Context, id string) (*domain.FlagWithStates, error)
	CreateFlag(ctx context.Context, flag *domain.FeatureFlag) error
	DeleteFlag(ctx context.Context, id string) error
}

type FlagStateRepository interface {
	GetState(ctx context.Context, flagID, envID string) (*domain.FlagState, error)
	ToggleState(ctx context.Context, flagID, envID string) (*domain.FlagState, error)
	UpsertState(ctx context.Context, state *domain.FlagState) error
}

type AuditRepository interface {
	GetEvents(ctx context.Context, limit int) ([]domain.AuditEventFull, error)
	CreateEvent(ctx context.Context, event *domain.AuditEvent) error
}

type UserRepository interface {
	GetUser(ctx context.Context, id string) (*domain.User, error)
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	GetUsers(ctx context.Context) ([]domain.User, error)
	CreateUser(ctx context.Context, user *domain.User) error
	UpdateUser(ctx context.Context, user *domain.User) error      // FIX 3
	UpdateLastLoginAt(ctx context.Context, id string) error       // FIX 3
}

type ProjectRepository interface {
	GetProjects(ctx context.Context) ([]domain.Project, error)
	GetProject(ctx context.Context, id string) (*domain.Project, error)
	CreateProject(ctx context.Context, project *domain.Project) error
}

type EnvironmentRepository interface {
	GetByProject(ctx context.Context, projectID string) ([]domain.Environment, error)
	GetByAPIKey(ctx context.Context, apiKey string) (*domain.Environment, error)
}

type DashboardRepository interface {
	GetStats(ctx context.Context, projectID string) (*domain.DashboardStats, error)
}
