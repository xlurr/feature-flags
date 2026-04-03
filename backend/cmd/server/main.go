package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	httpAdapter "github.com/xlurr/ff-manager/internal/adapters/http"
	"github.com/xlurr/ff-manager/internal/adapters/postgres"
	"github.com/xlurr/ff-manager/internal/services"
)

func main() {
	// slog.New() возвращает *slog.Logger — передаём pointer напрямую
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		logger.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := postgres.NewPool(ctx, dbURL)
	if err != nil {
		logger.Error("failed to connect to database", slog.Any("err", err))
		os.Exit(1)
	}
	defer pool.Close()
	logger.Info("database connected")

	// Repositories
	auditRepo     := postgres.NewAuditRepo(pool)
	flagRepo      := postgres.NewFlagRepo(pool)
	flagStateRepo := postgres.NewFlagStateRepo(pool)
	envRepo       := postgres.NewEnvRepo(pool)
	dashboardRepo := postgres.NewDashboardRepo(pool, auditRepo)

	// Stage 4: InMemoryCache — принимает *slog.Logger
	cache := services.NewInMemoryCache(5*time.Minute, logger)

	// Stage 5: EventBus
	eventBus := services.NewEventBus()

	// Services — все принимают *slog.Logger (не *logger, а logger)
	flagSvc      := services.NewFlagService(flagRepo, flagStateRepo, envRepo, auditRepo, cache, eventBus, logger)
	auditSvc     := services.NewAuditService(auditRepo, logger)
	dashboardSvc := services.NewDashboardService(dashboardRepo, logger)

	// HTTP handler
	handler := httpAdapter.NewHandler(flagSvc, auditSvc, dashboardSvc, pool.Ping, eventBus, logger)
	router  := handler.Router()

	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
		// WriteTimeout = 0 обязателен для SSE — long-lived connections
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 0,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Info("starting ff-manager backend", slog.String("port", port))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server failed", slog.Any("err", err))
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	logger.Info("shutting down gracefully")
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", slog.Any("err", err))
	}
	logger.Info("server stopped")
}
