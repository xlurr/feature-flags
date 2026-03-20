package domain

import "time"

type Role string

const (
	RoleAdmin     Role = "admin"
	RoleManager   Role = "manager"
	RoleDeveloper Role = "developer"
)

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	FullName     string    `json:"full_name"`
	IsActive     bool      `json:"is_active"`
	LastLoginAt  time.Time `json:"last_login_at"`
}

type Project struct {
	ID          string    `json:"id"`
	ProjectKey  string    `json:"project_key"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type Environment struct {
	ID           string    `json:"id"`
	ProjectID    string    `json:"project_id"`
	EnvKey       string    `json:"env_key"`
	Name         string    `json:"name"`
	ClientAPIKey string    `json:"client_api_key"`
	CreatedAt    time.Time `json:"created_at"`
}

type FeatureFlag struct {
	ID          string    `json:"id"`
	ProjectID   string    `json:"project_id"`
	AuthorID    string    `json:"author_id"`
	FlagKey     string    `json:"flag_key"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsPermanent bool      `json:"is_permanent"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type TargetingRule struct {
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
}

type FlagState struct {
	ID             string          `json:"id"`
	FlagID         string          `json:"flag_id"`
	EnvironmentID  string          `json:"environment_id"`
	IsEnabled      bool            `json:"is_enabled"`
	TargetingRules []TargetingRule `json:"targeting_rules"`
	RolloutWeight  int             `json:"rollout_weight"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type AuditEvent struct {
	ID            string    `json:"id"`
	FlagID        string    `json:"flag_id"`
	ActorID       string    `json:"actor_id"`
	EnvironmentID string    `json:"environment_id"`
	EventType     string    `json:"event_type"`
	DiffPayload   string    `json:"diff_payload"`
	CreatedAt     time.Time `json:"created_at"`
}

// Composite types

type FlagWithStates struct {
	FeatureFlag
	States     map[string]FlagState `json:"states"`
	AuthorName string               `json:"author_name,omitempty"`
}

type AuditEventFull struct {
	AuditEvent
	ActorName string `json:"actor_name,omitempty"`
	FlagKey   string `json:"flag_key,omitempty"`
	EnvKey    string `json:"env_key,omitempty"`
}

type DashboardStats struct {
	TotalFlags         int              `json:"total_flags"`
	ActiveInProduction int              `json:"active_in_production"`
	AuditEventsCount   int              `json:"audit_events_count"`
	EnvStats           []EnvStat        `json:"env_stats"`
	RecentAudit        []AuditEventFull `json:"recent_audit"`
}

type EnvStat struct {
	Name   string `json:"name"`
	Active int    `json:"active"`
	Total  int    `json:"total"`
}
