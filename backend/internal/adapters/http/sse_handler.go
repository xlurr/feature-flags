package http

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// streamEvents — SSE-эндпоинт для real-time обновлений флагов.
// Публичный: не требует JWT (Stage 6 не закрывает этот маршрут middleware).
//
// Pattern #9 (State Clone): сначала отправляем снэпшот текущего состояния
// флагов, затем подписываемся — клиент никогда не теряет события между
// загрузкой страницы и установкой соединения.
func (h *Handler) streamEvents(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectID")

	// SSE-заголовки. X-Accel-Buffering: no — отключает nginx-буферизацию.
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Pattern #9: отправляем снэпшот до подписки на live-события.
	snapshot, err := h.flagService.ListFlags(r.Context(), projectID)
	if err != nil {
		h.logger.Error("sse: snapshot error", slog.String("projectID", projectID), slog.Any("err", err))
	} else {
		data, _ := json.Marshal(snapshot)
		fmt.Fprintf(w, "event: SNAPSHOT\ndata: %s\n\n", data)
		flusher.Flush()
	}

	ch := h.eventBus.Subscribe(projectID)
	// Unsubscribe вызывается при дисконнекте — закрывает канал.
	defer h.eventBus.Unsubscribe(projectID, ch)

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-ch:
			if !ok {
				return
			}
			data, _ := json.Marshal(evt)
			fmt.Fprintf(w, "event: FLAG_CHANGE\ndata: %s\n\n", data)
			flusher.Flush()
		}
	}
}
