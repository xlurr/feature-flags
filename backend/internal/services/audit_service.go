package services

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/xlurr/ff-manager/internal/domain"
	"github.com/xlurr/ff-manager/internal/ports"
)

type AuditService struct {
	repo   ports.AuditRepository
	logger *slog.Logger
}

func NewAuditService(repo ports.AuditRepository, logger *slog.Logger) *AuditService {
	return &AuditService{repo: repo, logger: logger}
}

func (s *AuditService) GetEvents(ctx context.Context, limit int) ([]domain.AuditEventFull, error) {
	events, err := s.repo.GetEvents(ctx, limit)
	if err != nil {
		return nil, fmt.Errorf("AuditService.GetEvents: %w", err)
	}
	return events, nil
}

func (s *AuditService) LogEvent(ctx context.Context, event *domain.AuditEvent) error {
	if err := s.repo.CreateEvent(ctx, event); err != nil {
		return fmt.Errorf("AuditService.LogEvent: %w", err)
	}
	return nil
}
