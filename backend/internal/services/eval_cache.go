package services

import "context"

// EvalCache определяет интерфейс кэша для /eval endpoint.
type EvalCache interface {
	Get(ctx context.Context, apiKey string) (map[string]bool, bool)
	Set(ctx context.Context, apiKey string, flags map[string]bool)
	InvalidateByEnv(ctx context.Context, envID string)
	InvalidateProject(ctx context.Context, projectID string)
}

// NoopCache — заглушка без кэширования (заменяется на InMemoryCache в Stage 4).
type NoopCache struct{}

func NewNoopCache() *NoopCache { return &NoopCache{} }

func (c *NoopCache) Get(_ context.Context, _ string) (map[string]bool, bool) { return nil, false }
func (c *NoopCache) Set(_ context.Context, _ string, _ map[string]bool)      {}
func (c *NoopCache) InvalidateByEnv(_ context.Context, _ string)             {}
func (c *NoopCache) InvalidateProject(_ context.Context, _ string)           {}
