package services

import "context"

// EvalCache caches /eval endpoint results keyed by API key.
type EvalCache interface {
	Get(ctx context.Context, apiKey string) (map[string]bool, bool)
	// Set stores flags for apiKey; envID and projectID build invalidation indexes.
	Set(ctx context.Context, apiKey, envID, projectID string, flags map[string]bool)
	InvalidateByEnv(ctx context.Context, envID string)
	InvalidateProject(ctx context.Context, projectID string)
}

// NoopCache is a no-op placeholder (used in tests / replaced by InMemoryCache).
type NoopCache struct{}

func NewNoopCache() NoopCache { return NoopCache{} }

func (c NoopCache) Get(_ context.Context, _ string) (map[string]bool, bool) {
	return nil, false
}
func (c NoopCache) Set(_ context.Context, _, _, _ string, _ map[string]bool) {}
func (c NoopCache) InvalidateByEnv(_ context.Context, _ string)              {}
func (c NoopCache) InvalidateProject(_ context.Context, _ string)            {}
