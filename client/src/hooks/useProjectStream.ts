import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type SseStatus = "connecting" | "connected" | "disconnected";

/**
 * Подписывается на SSE /api/stream/{projectId}.
 * Инвалидирует кэш TanStack Query при SNAPSHOT и FLAGCHANGE.
 * Возвращает статус подключения.
 */
export function useProjectStream(projectId: string): SseStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SseStatus>("connecting");

  useEffect(() => {
    if (!projectId) return;

    const es = new EventSource(`/api/stream/${projectId}`);

    es.onopen = () => setStatus("connected");
    es.onerror = () => {
      setStatus("disconnected");
      es.close();
    };

    es.addEventListener("SNAPSHOT", () => {
      queryClient.invalidateQueries({ queryKey: [`flags/${projectId}`] });
    });

    es.addEventListener("FLAGCHANGE", () => {
      queryClient.invalidateQueries({ queryKey: [`flags/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`dashboard/${projectId}`] });
    });

    return () => {
      es.close();
      setStatus("disconnected");
    };
  }, [projectId, queryClient]);

  return status;
}
