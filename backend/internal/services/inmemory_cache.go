package services

import (
	"context"
	"log/slog"
	"sync"
	"sync/atomic"
	"time"
)

type cacheEntry struct {
	flags     map[string]bool
	expiresAt time.Time
	envID     string
	projectID string
}

// InMemoryCache is a TTL-based eval cache with per-env and per-project invalidation.
// Uses sync.RWMutex + regular maps (never sync.Map — project rule §3).
type InMemoryCache struct {
	mu        sync.RWMutex
	entries   map[string]cacheEntry // apiKey -> entry
	envIndex  map[string][]string   // envID -> []apiKey
	projIndex map[string][]string   // projectID -> []apiKey
	ttl       time.Duration
	hits      atomic.Int64
	misses    atomic.Int64
	logger    *slog.Logger
}

// NewInMemoryCache creates a cache with given TTL and starts a background cleanup goroutine.
func NewInMemoryCache(ttl time.Duration, logger *slog.Logger) *InMemoryCache {
	c := &InMemoryCache{
		entries:   make(map[string]cacheEntry),
		envIndex:  make(map[string][]string),
		projIndex: make(map[string][]string),
		ttl:       ttl,
		logger:    logger,
	}
	go c.cleanupLoop()
	return c
}

// Get returns cached flags. Returns (nil, false) on miss or expiry.
func (c *InMemoryCache) Get(_ context.Context, apiKey string) (map[string]bool, bool) {
	c.mu.RLock()
	e, ok := c.entries[apiKey]
	c.mu.RUnlock()

	if !ok || time.Now().After(e.expiresAt) {
		c.misses.Add(1)
		return nil, false
	}
	c.hits.Add(1)
	// Return a defensive copy — caller must not mutate the cached map.
	result := make(map[string]bool, len(e.flags))
	for k, v := range e.flags {
		result[k] = v
	}
	return result, true
}

// Set stores flags and registers the entry in envIndex / projIndex for invalidation.
func (c *InMemoryCache) Set(_ context.Context, apiKey, envID, projectID string, flags map[string]bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Remove stale index entries if the key was already cached.
	if old, ok := c.entries[apiKey]; ok {
		c.removeFromIndex(c.envIndex, old.envID, apiKey)
		c.removeFromIndex(c.projIndex, old.projectID, apiKey)
	}

	cp := make(map[string]bool, len(flags))
	for k, v := range flags {
		cp[k] = v
	}

	c.entries[apiKey] = cacheEntry{
		flags:     cp,
		expiresAt: time.Now().Add(c.ttl),
		envID:     envID,
		projectID: projectID,
	}
	c.envIndex[envID] = append(c.envIndex[envID], apiKey)
	c.projIndex[projectID] = append(c.projIndex[projectID], apiKey)
}

// InvalidateByEnv deletes all entries tied to the given envID.
func (c *InMemoryCache) InvalidateByEnv(_ context.Context, envID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	keys := c.envIndex[envID]
	for _, k := range keys {
		e := c.entries[k]
		c.removeFromIndex(c.projIndex, e.projectID, k)
		delete(c.entries, k)
	}
	delete(c.envIndex, envID)
	c.logger.Info("cache invalidated by env", "envID", envID, "count", len(keys))
}

// InvalidateProject deletes all entries tied to the given projectID.
func (c *InMemoryCache) InvalidateProject(_ context.Context, projectID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	keys := c.projIndex[projectID]
	for _, k := range keys {
		e := c.entries[k]
		c.removeFromIndex(c.envIndex, e.envID, k)
		delete(c.entries, k)
	}
	delete(c.projIndex, projectID)
	c.logger.Info("cache invalidated by project", "projectID", projectID, "count", len(keys))
}

// Stats returns hit/miss counters and current live entry count (useful for metrics/logging).
func (c *InMemoryCache) Stats() (hits, misses, entries int64) {
	c.mu.RLock()
	e := int64(len(c.entries))
	c.mu.RUnlock()
	return c.hits.Load(), c.misses.Load(), e
}

// cleanupLoop evicts expired entries every 10 minutes.
func (c *InMemoryCache) cleanupLoop() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		c.evictExpired()
	}
}

func (c *InMemoryCache) evictExpired() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	evicted := 0
	for k, e := range c.entries {
		if now.After(e.expiresAt) {
			c.removeFromIndex(c.envIndex, e.envID, k)
			c.removeFromIndex(c.projIndex, e.projectID, k)
			delete(c.entries, k)
			evicted++
		}
	}
	if evicted > 0 {
		c.logger.Info("cache eviction complete", "evicted", evicted, "remaining", len(c.entries))
	}
}

// removeFromIndex removes val from the slice at idx[key].
func (c *InMemoryCache) removeFromIndex(idx map[string][]string, key, val string) {
	s := idx[key]
	for i, v := range s {
		if v == val {
			idx[key] = append(s[:i], s[i+1:]...)
			if len(idx[key]) == 0 {
				delete(idx, key)
			}
			return
		}
	}
}
