package domain

import "time"

type Project struct {
	ID          string    `json:"id"`
	ProjectKey  string    `json:"projectKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}

type User struct {
	ID           string     `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	Role         string     `json:"role"`
	FullName     string     `json:"fullName"`
	IsActive     bool       `json:"isActive"`
	LastLoginAt  time.Time `json:"lastLoginAt"`
}

type Environment struct {
	ID           string    `json:"id"`
	ProjectID    string    `json:"projectId"`
	EnvKey       string    `json:"envKey"`
	Name         string    `json:"name"`
	ClientAPIKey string    `json:"clientApiKey"`
	CreatedAt    time.Time `json:"createdAt"`
}

type TargetingRule struct {
	Type  string `json:"type"`
	Value any    `json:"value"`
}

type FlagState struct {
	ID             string          `json:"id"`
	FlagID         string          `json:"flagId"`
	EnvironmentID  string          `json:"environmentId"`
	IsEnabled      bool            `json:"isEnabled"`
	TargetingRules []TargetingRule `json:"targetingRules"`
	RolloutWeight  int             `json:"rolloutWeight"`
	UpdatedAt      time.Time       `json:"updatedAt"`
}

type FeatureFlag struct {
	ID          string    `json:"id"`
	ProjectID   string    `json:"projectId"`
	AuthorID    string    `json:"authorId"`
	FlagKey     string    `json:"flagKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsPermanent bool      `json:"isPermanent"`
	ArchivedAt  *time.Time `json:"archivedAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type FlagWithStates struct {
	FeatureFlag
	AuthorName string               `json:"authorName"`
	States     map[string]FlagState `json:"states"`
}

type AuditEvent struct {
	ID            string    `json:"id"`
	FlagID        string    `json:"flagId"`
	ActorID       string    `json:"actorId"`
	EnvironmentID string    `json:"environmentId"`
	EventType     string    `json:"eventType"`
	DiffPayload   string    `json:"diffPayload"`
	CreatedAt     time.Time `json:"createdAt"`
}

type AuditEventFull struct {
	AuditEvent
	ActorName string `json:"actorName"`
	FlagKey   string `json:"flagKey"`
	EnvKey    string `json:"envKey"`
}

type EnvStat struct {
	Name   string `json:"name"`
	Active int    `json:"active"`
	Total  int    `json:"total"`
}

type DashboardStats struct {
	TotalFlags         int              `json:"totalFlags"`
	ActiveInProduction int              `json:"activeInProduction"`
	AuditEventsCount   int              `json:"auditEventsCount"`
	EnvStats           []EnvStat        `json:"envStats"`
	RecentAudit        []AuditEventFull `json:"recentAudit"`
}

// Role — тип роли пользователя (нужен для user_repo.go).

// Role — тип роли пользователя (нужен для user_repo.go).

// Role — тип роли пользователя (нужен для user_repo.go).

// Role - тип роли пользователя.
type Role = string
