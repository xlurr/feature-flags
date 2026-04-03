import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * useProjectStream — подключается к SSE-эндпоинту /api/stream/{projectId}
 * и при получении FLAG_CHANGE инвалидирует React Query кэш флагов и дашборда.
 *
 * EventSource автоматически переподключается при разрыве — retry не нужен.
 */
export function useProjectStream(projectId: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!projectId) return

    const es = new EventSource(`/api/stream/${projectId}`)

    // SNAPSHOT — первичная загрузка: инвалидируем, чтобы React Query
    // обновил данные из свежего ответа сервера.
    es.addEventListener('SNAPSHOT', () => {
      queryClient.invalidateQueries({ queryKey: [`api/flags/${projectId}`] })
    })

    // FLAG_CHANGE — любое изменение флага: пересинхронизируем флаги и дашборд.
    es.addEventListener('FLAG_CHANGE', () => {
      queryClient.invalidateQueries({ queryKey: [`api/flags/${projectId}`] })
      queryClient.invalidateQueries({ queryKey: [`api/dashboard/${projectId}`] })
    })

    return () => {
      es.close()
    }
  }, [projectId, queryClient])
}
