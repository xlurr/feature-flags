import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Подписывается на SSE /api/stream/{projectId}.
 * Инвалидирует кэш TanStack Query при SNAPSHOT и FLAGCHANGE.
 */
export function useProjectStream(projectId: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const es = new EventSource(`/api/stream/${projectId}`);

    es.addEventListener("SNAPSHOT", () => {
      queryClient.invalidateQueries({ queryKey: [`flags/${projectId}`] });
    });

    es.addEventListener("FLAGCHANGE", () => {
      queryClient.invalidateQueries({ queryKey: [`flags/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`dashboard/${projectId}`] });
    });

    es.onerror = () => { es.close(); };

    return () => es.close();
  }, [projectId, queryClient]);
}
