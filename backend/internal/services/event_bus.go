package services

import "sync"

// SSEEvent — событие, рассылаемое подписчикам через SSE.
type SSEEvent struct {
	Type      string `json:"type"`
	ProjectID string `json:"projectId"`
	FlagID    string `json:"flagId,omitempty"`
	EnvID     string `json:"envId,omitempty"`
	Payload   string `json:"payload,omitempty"`
}

// EventBus рассылает SSE-события подписчикам, сгруппированным по projectID.
// Pattern #5: каждый подписчик изолирован — медленный клиент не блокирует остальных.
// Pattern #6: Publish неблокирующий (select+default) — переполненный буфер → drop.
type EventBus struct {
	mu          sync.RWMutex
	subscribers map[string][]chan SSEEvent // projectID → каналы
}

// NewEventBus создаёт инициализированный EventBus.
func NewEventBus() *EventBus {
	return &EventBus{
		subscribers: make(map[string][]chan SSEEvent),
	}
}

// Subscribe регистрирует новый буферизованный канал (cap 32) для projectID.
func (b *EventBus) Subscribe(projectID string) chan SSEEvent {
	ch := make(chan SSEEvent, 32)
	b.mu.Lock()
	b.subscribers[projectID] = append(b.subscribers[projectID], ch)
	b.mu.Unlock()
	return ch
}

// Unsubscribe убирает канал из списка подписчиков и закрывает его.
func (b *EventBus) Unsubscribe(projectID string, ch chan SSEEvent) {
	b.mu.Lock()
	defer b.mu.Unlock()
	subs := b.subscribers[projectID]
	out := subs[:0]
	for _, c := range subs {
		if c != ch {
			out = append(out, c)
		}
	}
	if len(out) == 0 {
		delete(b.subscribers, projectID)
	} else {
		b.subscribers[projectID] = out
	}
	close(ch)
}

// Publish отправляет событие всем подписчикам projectID.
// Non-blocking: если буфер подписчика полон — событие дропается для него.
func (b *EventBus) Publish(projectID string, event SSEEvent) {
	b.mu.RLock()
	subs := make([]chan SSEEvent, len(b.subscribers[projectID]))
	copy(subs, b.subscribers[projectID])
	b.mu.RUnlock()

	for _, ch := range subs {
		select {
		case ch <- event:
		default:
			// Pattern #6: slow client — drop, never block mutation path
		}
	}
}
