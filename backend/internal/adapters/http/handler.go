package http

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/xlurr/ff-manager/internal/ports"
)

type Handler struct {
	flagService      ports.FlagService
	auditService     ports.AuditService
	dashboardService ports.DashboardService
	dbPing           func(ctx context.Context) error
	logger           *slog.Logger
}

func NewHandler(
	fs ports.FlagService,
	as ports.AuditService,
	ds ports.DashboardService,
	dbPing func(ctx context.Context) error,
	logger *slog.Logger,
) *Handler {
	return &Handler{
		flagService: fs, auditService: as, dashboardService: ds,
		dbPing: dbPing, logger: logger,
	}
}

func (h *Handler) Router() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Compress(5))
	// FIX2: AllowCredentials true, убран wildcard origin
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// FIX1: /eval и /health — корневой уровень, вне /api
	r.Get("/health", h.healthCheck)
	r.Get("/eval/{apiKey}", h.evalFlags)

	r.Route("/api", func(r chi.Router) {
		r.Get("/dashboard/{projectID}", h.getDashboard)
		r.Get("/flags/{projectID}", h.getFlags)
		r.Post("/flags", h.createFlag)
		r.Delete("/flags/{id}", h.deleteFlag)
		r.Put("/flags/{flagID}/toggle/{envID}", h.toggleFlag)
		r.Get("/audit", h.getAudit)
		// FIX-ENV: endpoint для settings/flags страниц
		r.Get("/environments/{projectID}", h.getEnvironments)
	})
	return r
}

func (h *Handler) healthCheck(w http.ResponseWriter, r *http.Request) {
	if err := h.dbPing(r.Context()); err != nil {
		h.logger.Error("health check: db ping failed", "err", err)
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "error", "db": err.Error(),
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "db": "connected"})
}

func (h *Handler) getDashboard(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")
	stats, err := h.dashboardService.GetStats(r.Context(), projectID)
	if err != nil {
		h.logger.Error("dashboard error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *Handler) getFlags(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")
	flags, err := h.flagService.ListFlags(r.Context(), projectID)
	if err != nil {
		h.logger.Error("list flags error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
		return
	}
	writeJSON(w, http.StatusOK, flags)
}

func (h *Handler) getEnvironments(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")
	envs, err := h.flagService.ListEnvironments(r.Context(), projectID)
	if err != nil {
		h.logger.Error("get environments error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
		return
	}
	writeJSON(w, http.StatusOK, envs)
}

type createFlagRequest struct {
	ProjectID   string `json:"projectId"`
	FlagKey     string `json:"flagKey"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *Handler) createFlag(w http.ResponseWriter, r *http.Request) {
	var req createFlagRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	flag, err := h.flagService.CreateFlag(r.Context(), req.ProjectID, req.FlagKey, req.Name, req.Description)
	if err != nil {
		h.logger.Error("create flag error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
		return
	}
	writeJSON(w, http.StatusCreated, flag)
}

func (h *Handler) deleteFlag(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.flagService.DeleteFlag(r.Context(), id); err != nil {
		h.logger.Error("delete flag error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *Handler) toggleFlag(w http.ResponseWriter, r *http.Request) {
	flagID := chi.URLParam(r, "flagID")
	envID  := chi.URLParam(r, "envID")
	state, err := h.flagService.ToggleFlag(r.Context(), flagID, envID)
	if err != nil {
		h.logger.Error("toggle flag error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
		return
	}
	writeJSON(w, http.StatusOK, state)
}

func (h *Handler) getAudit(w http.ResponseWriter, r *http.Request) {
	events, err := h.auditService.GetEvents(r.Context(), 50)
	if err != nil {
		h.logger.Error("audit error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
		return
	}
	writeJSON(w, http.StatusOK, events)
}

func (h *Handler) evalFlags(w http.ResponseWriter, r *http.Request) {
	apiKey := chi.URLParam(r, "apiKey")
	result, err := h.flagService.EvaluateFlags(r.Context(), apiKey)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "invalid api key"})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
