import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr'
import { authStorage } from '../api/authStorage'

export interface PlayerJoinedToLobbyNotification {
  userId: string
  username: string
}

export interface PlayerClaimedSeatNotification {
  seatId: string
  userId: string
  username: string
}

export type TableRealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'

export interface TableRealtimeHandlers {
  onPlayerJoinedToLobby?: (notification: PlayerJoinedToLobbyNotification) => void
  onPlayerClaimedSeat?: (notification: PlayerClaimedSeatNotification) => void
  onStatusChange?: (status: TableRealtimeStatus) => void
  onError?: (message: string) => void
}

interface SignalRObject {
  [key: string]: unknown
}

function getString(payload: SignalRObject, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

function asObject(payload: unknown): SignalRObject | null {
  return typeof payload === 'object' && payload !== null ? payload as SignalRObject : null
}

function parsePlayerJoinedNotification(payload: unknown): PlayerJoinedToLobbyNotification | null {
  const object = asObject(payload)
  if (!object) return null
  const userId = getString(object, 'UserId', 'userId')
  const username = getString(object, 'Username', 'username')
  return userId && username ? { userId, username } : null
}

function parsePlayerClaimedSeatNotification(payload: unknown): PlayerClaimedSeatNotification | null {
  const object = asObject(payload)
  if (!object) return null
  const seatId = getString(object, 'SeatId', 'seatId')
  const userId = getString(object, 'UserId', 'userId')
  const username = getString(object, 'Username', 'username')
  return seatId && userId && username ? { seatId, userId, username } : null
}

function getHubUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '')
  if (!apiBaseUrl) throw new Error('The API base URL is not configured.')
  return `${apiBaseUrl}/hubs/table`
}

export class TableRealtimeService {
  private connection: HubConnection | null = null
  private activeTableId: string | null = null
  private handlers: TableRealtimeHandlers | null = null
  private operationId = 0

  async start(tableId: string, handlers: TableRealtimeHandlers): Promise<void> {
    const operationId = ++this.operationId
    const previousConnection = this.connection
    this.connection = null
    this.activeTableId = null
    this.handlers = null
    await this.stopConnection(previousConnection)

    if (operationId !== this.operationId) return

    const connection = new HubConnectionBuilder()
      .withUrl(getHubUrl(), {
        accessTokenFactory: () => authStorage.getAccessToken() ?? '',
        withCredentials: false,
      })
      .withAutomaticReconnect([0, 2_000, 10_000, 30_000])
      .configureLogging(LogLevel.Warning)
      .build()

    this.connection = connection
    this.activeTableId = tableId
    this.handlers = handlers
    this.registerHandlers(connection, tableId, operationId)
    this.notifyStatus(connection, operationId, 'connecting')

    try {
      await connection.start()
      if (!this.isCurrent(connection, tableId, operationId)) {
        await this.stopConnection(connection)
        return
      }

      await connection.invoke('JoinTable', tableId)
      if (this.isCurrent(connection, tableId, operationId)) this.notifyStatus(connection, operationId, 'connected')
    } catch (error: unknown) {
      if (!this.isCurrent(connection, tableId, operationId)) {
        await this.stopConnection(connection)
        return
      }
      this.reportError(connection, operationId, 'Unable to connect to the table realtime service.', error)
      this.notifyStatus(connection, operationId, 'error')
      this.connection = null
      this.activeTableId = null
      this.handlers = null
      await this.stopConnection(connection)
    }
  }

  async stop(): Promise<void> {
    ++this.operationId
    const connection = this.connection
    this.connection = null
    this.activeTableId = null
    this.handlers = null
    await this.stopConnection(connection)
  }

  private registerHandlers(connection: HubConnection, tableId: string, operationId: number): void {
    connection.on('PlayerJoinedToLobbyNotification', (payload: unknown) => {
      console.log('[SignalR] Event received: PlayerJoinedToLobbyNotification', payload)
      const notification = parsePlayerJoinedNotification(payload)
      if (notification && this.isCurrent(connection, tableId, operationId)) this.handlers?.onPlayerJoinedToLobby?.(notification)
    })

    connection.on('PlayerClaimedSeatNotification', (payload: unknown) => {
      console.log('[SignalR] Event received: PlayerClaimedSeatNotification', payload)
      const notification = parsePlayerClaimedSeatNotification(payload)
      if (notification && this.isCurrent(connection, tableId, operationId)) this.handlers?.onPlayerClaimedSeat?.(notification)
    })

    connection.onreconnecting((error) => {
      if (this.isCurrent(connection, tableId, operationId)) {
        this.notifyStatus(connection, operationId, 'reconnecting')
        if (error) this.handlers?.onError?.('The table connection was interrupted. Reconnecting...')
      }
    })

    connection.onreconnected(async () => {
      if (!this.isCurrent(connection, tableId, operationId)) return
      try {
        await connection.invoke('JoinTable', tableId)
        if (this.isCurrent(connection, tableId, operationId)) this.notifyStatus(connection, operationId, 'connected')
      } catch (error: unknown) {
        this.reportError(connection, operationId, 'Unable to rejoin the table after reconnecting.', error)
        this.notifyStatus(connection, operationId, 'error')
      }
    })

    connection.onclose((error) => {
      if (!this.isCurrent(connection, tableId, operationId)) return
      this.notifyStatus(connection, operationId, 'disconnected')
      if (error) this.handlers?.onError?.('The table realtime connection closed.')
    })
  }

  private isCurrent(connection: HubConnection, tableId: string, operationId: number): boolean {
    return this.connection === connection && this.activeTableId === tableId && this.operationId === operationId
  }

  private notifyStatus(connection: HubConnection, operationId: number, status: TableRealtimeStatus): void {
    if (this.connection === connection && this.operationId === operationId) this.handlers?.onStatusChange?.(status)
  }

  private reportError(connection: HubConnection, operationId: number, message: string, error: unknown): void {
    if (this.connection !== connection || this.operationId !== operationId) return
    console.error(message, error)
    this.handlers?.onError?.(message)
  }

  private async stopConnection(connection: HubConnection | null): Promise<void> {
    if (!connection) return
    connection.off('PlayerJoinedToLobbyNotification')
    connection.off('PlayerClaimedSeatNotification')
    if (connection.state !== HubConnectionState.Disconnected) await connection.stop().catch(() => {})
  }
}