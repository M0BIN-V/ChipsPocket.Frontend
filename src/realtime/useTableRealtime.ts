import { useEffect, useRef, useState } from 'react'
import {
  TableRealtimeService,
  type PlayerClaimedSeatNotification,
  type PlayerJoinedToLobbyNotification,
  type PlayerReleasedSeatNotification,
  type TableRealtimeStatus,
} from './tableRealtimeService'

export interface UseTableRealtimeHandlers {
  onPlayerJoinedToLobby?: (notification: PlayerJoinedToLobbyNotification) => void
  onPlayerClaimedSeat?: (notification: PlayerClaimedSeatNotification) => void
  onPlayerReleasedSeat?: (notification: PlayerReleasedSeatNotification) => void
}

export function useTableRealtime(tableId: string | undefined, handlers: UseTableRealtimeHandlers) {
  const [service] = useState(() => new TableRealtimeService())
  const handlersRef = useRef(handlers)
  const [status, setStatus] = useState<TableRealtimeStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    let isMounted = true

    if (!tableId) {
      return () => { isMounted = false; void service.stop() }
    }

    void service.start(tableId, {
      onPlayerJoinedToLobby: (notification) => {
        if (isMounted) handlersRef.current.onPlayerJoinedToLobby?.(notification)
      },
      onPlayerClaimedSeat: (notification) => {
        if (isMounted) handlersRef.current.onPlayerClaimedSeat?.(notification)
      },
      onPlayerReleasedSeat: (notification) => {
        if (isMounted) handlersRef.current.onPlayerReleasedSeat?.(notification)
      },
      onStatusChange: (nextStatus) => {
        if (isMounted) {
          setStatus(nextStatus)
          if (nextStatus === 'connecting' || nextStatus === 'connected') setError(null)
        }
      },
      onError: (message) => {
        if (isMounted) setError(message)
      },
    })

    return () => {
      isMounted = false
      void service.stop()
    }
  }, [service, tableId])

  return { status: tableId ? status : 'disconnected' as const, error: tableId ? error : null }
}