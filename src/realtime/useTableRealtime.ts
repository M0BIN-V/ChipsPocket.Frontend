import { useEffect, useRef, useState } from 'react'
import {
  TableRealtimeService,
  type MemberClaimedSeatNotification,
  type MemberJoinedToTableNotification,
  type MemberReleasedSeatNotification,
  type TableRealtimeStatus,
} from './tableRealtimeService'

export interface UseTableRealtimeHandlers {
  onMemberJoinedToTable?: (notification: MemberJoinedToTableNotification) => void
  onMemberClaimedSeat?: (notification: MemberClaimedSeatNotification) => void
  onMemberReleasedSeat?: (notification: MemberReleasedSeatNotification) => void
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
      onMemberJoinedToTable: (notification) => {
        if (isMounted) handlersRef.current.onMemberJoinedToTable?.(notification)
      },
      onMemberClaimedSeat: (notification) => {
        if (isMounted) handlersRef.current.onMemberClaimedSeat?.(notification)
      },
      onMemberReleasedSeat: (notification) => {
        if (isMounted) handlersRef.current.onMemberReleasedSeat?.(notification)
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