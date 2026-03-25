package services

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/xlurr/ff-manager/internal/domain"
	"github.com/xlurr/ff-manager/internal/ports"
)

type DashboardService struct {
	repo   ports.DashboardRepository
	logger *slog.Logger
}

func NewDashboardService(repo ports.DashboardRepository, logger *slog.Logger) *DashboardService {
	return &DashboardService{repo: repo, logger: logger}
}

func (s *DashboardService) GetStats(ctx context.Context, projectID string) (*domain.DashboardStats, error) {
	stats, err := s.repo.GetStats(ctx, projectID)
	if err != nil {
		return nil, fmt.Errorf("DashboardService.GetStats: %w", err)
	}
	return stats, nil
}
