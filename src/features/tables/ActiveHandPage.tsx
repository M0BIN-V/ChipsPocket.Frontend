import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, LoaderCircle, Users, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { mockHandService } from '../../api/handService'
import { getAvailableAction } from './handAction'
import type { Chip, ChipStack, HandPlayer, HandState } from './hand.types'

const STACK_SNAP_DISTANCE = 0.12
const CHIP_HEIGHT = 0.9

type StackSource = 'player' | 'pot'
interface DragState {
  source: StackSource
  stackId: string
  chipIds: string[]
  position: { x: number; y: number }
  grabOffset: { x: number; y: number }
  moveStack: boolean
}

function money(value: number) {
  return `$${value.toLocaleString('en-US')}`
}

function chipTotal(stacks: ChipStack[]) {
  return stacks.reduce((total, stack) => total + stack.chips.reduce((stackTotal, chip) => stackTotal + chip.value, 0), 0)
}

export function ActiveHandPage() {
  const navigate = useNavigate()
  const { tableId, handId } = useParams<{ tableId: string; handId: string }>()
  const [hand, setHand] = useState<HandState | null>(null)
  const [isPlayersOpen, setIsPlayersOpen] = useState(false)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const potRef = useRef<HTMLDivElement>(null)
  const [initialPotValue, setInitialPotValue] = useState(0)

  useEffect(() => {
    if (!handId || !tableId) return
    let mounted = true
    void mockHandService.getHandState(handId, tableId).then((state) => {
      if (mounted) {
        setHand(state)
        setInitialPotValue(chipTotal(state.potChips))
      }
    })
    return () => { mounted = false }
  }, [handId, tableId])

  useEffect(() => {
    if (!drag) return
    function move(event: PointerEvent) {
      const board = boardRef.current
      if (!board) return
      const rect = board.getBoundingClientRect()
      setDrag((current) => current && {
        ...current,
        position: {
          x: Math.max(0.04, Math.min(0.96, (event.clientX - rect.left) / rect.width - current.grabOffset.x)),
          y: Math.max(0.08, Math.min(0.92, (event.clientY - rect.top) / rect.height - current.grabOffset.y)),
        },
      })
    }
    function end(event: PointerEvent) {
      // The active drag callback intentionally reads the latest local hand state.
      // eslint-disable-next-line react-hooks/immutability
      finishDrag(event.clientX, event.clientY)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag])

  if (!hand) {
    return <main className="app-shell active-hand-loading"><LoaderCircle size={26} className="animate-spin" aria-label="Loading hand" /></main>
  }

  const currentPot = chipTotal(hand.potChips)
  const selectedAmount = Math.max(0, currentPot - initialPotValue)
  const action = getAvailableAction(hand, selectedAmount)
  const isMyTurn = hand.currentPlayerId === hand.myPlayerId

  function toPosition(clientX: number, clientY: number) {
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0.5, y: 0.5 }
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height }
  }

  function beginDrag(event: React.PointerEvent, source: StackSource, stack: ChipStack, moveStack: boolean, selectedChip = stack.chips[stack.chips.length - 1]) {
    if (!isMyTurn || source === 'pot' && !selectedChip?.isMine) return
    event.preventDefault()
    const boardPosition = toPosition(event.clientX, event.clientY)
    const board = boardRef.current?.getBoundingClientRect()
    const target = event.currentTarget.getBoundingClientRect()
    const targetCenter = { x: (target.left + target.width / 2 - (board?.left ?? 0)) / (board?.width ?? 1), y: (target.top + target.height / 2 - (board?.top ?? 0)) / (board?.height ?? 1) }
    const position = moveStack ? stack.position : targetCenter
    const chipIds = moveStack
      ? stack.chips.filter((chip) => source !== 'pot' || chip.isMine).map((chip) => chip.id)
      : [selectedChip.id]
    if (chipIds.length === 0) return
    setDrag({
      source,
      stackId: stack.id,
      chipIds,
      position,
      grabOffset: { x: boardPosition.x - position.x, y: boardPosition.y - position.y },
      moveStack,
    })
  }

  function getDropTarget(clientX: number, clientY: number) {
    const potRect = potRef.current?.getBoundingClientRect()
    return Boolean(potRect && clientX >= potRect.left && clientX <= potRect.right && clientY >= potRect.top && clientY <= potRect.bottom)
  }

  function finishDrag(clientX: number, clientY: number) {
    if (!drag) return
    const currentHand = hand
    if (!currentHand) { setDrag(null); return }
    const sourceStacks = drag.source === 'player' ? currentHand.myStack : currentHand.potChips
    const sourceStack = sourceStacks.find((stack) => stack.id === drag.stackId)
    if (!sourceStack) { setDrag(null); return }
    const draggedChips = sourceStack.chips.filter((chip) => drag.chipIds.includes(chip.id))
    const remainingChips = sourceStack.chips.filter((chip) => !drag.chipIds.includes(chip.id))
    const destination: StackSource = getDropTarget(clientX, clientY) ? 'pot' : 'player'
    const destinationStacks = destination === 'player' ? currentHand.myStack : currentHand.potChips
    const position = drag.position
    const target = destinationStacks.find((stack) => stack.id !== sourceStack.id && Math.hypot(stack.position.x - position.x, stack.position.y - position.y) < STACK_SNAP_DISTANCE)
    const keptSource = remainingChips.length > 0 ? [{ ...sourceStack, chips: remainingChips }] : []
    const withoutSource = sourceStacks.filter((stack) => stack.id !== sourceStack.id)
    const nextDestination = destination === drag.source ? withoutSource : destinationStacks
    const mergedDestination = target
      ? nextDestination.map((stack) => stack.id === target.id ? { ...stack, chips: [...stack.chips, ...draggedChips] } : stack)
      : [...nextDestination, { id: `${destination}-stack-${Date.now()}`, chips: draggedChips, position }]
    const nextPlayerStacks = drag.source === 'player'
      ? destination === 'player' ? [...keptSource, ...mergedDestination] : [...keptSource]
      : destination === 'player' ? mergedDestination : currentHand.myStack
    const nextPotStacks = drag.source === 'pot'
      ? destination === 'pot' ? [...keptSource, ...mergedDestination] : [...keptSource]
      : destination === 'pot' ? mergedDestination : currentHand.potChips
    setHand({ ...currentHand, myStack: nextPlayerStacks, potChips: nextPotStacks })
    setDrag(null)
  }

  function visibleChips(stack: ChipStack) {
    if (!drag || drag.stackId !== stack.id || drag.source !== 'player' && drag.source !== 'pot') return stack.chips
    if (drag.moveStack) return stack.chips
    return stack.chips.filter((chip) => !drag.chipIds.includes(chip.id))
  }

  function draggedChips(): Chip[] {
    if (!drag || drag.moveStack || !hand) return []
    const stacks = drag.source === 'player' ? hand.myStack : hand.potChips
    return stacks.find((stack) => stack.id === drag.stackId)?.chips.filter((chip) => drag.chipIds.includes(chip.id)) ?? []
  }

  async function submitAction() {
    if (!handId || !isMyTurn || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await mockHandService.submitAction(handId, action, hand?.potChips.flatMap((stack) => stack.chips.map((chip) => chip.id)) ?? [])
    } catch {
      setSubmitError('Action rejected.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStacks = (stacks: ChipStack[], source: StackSource) => stacks.map((stack) => {
    const chips = visibleChips(stack)
    const isDragged = drag?.stackId === stack.id && drag.source === source && drag.moveStack
    const position = isDragged ? drag.position : stack.position
    return (
      <div
        className={`chip-stack ${isDragged ? 'chip-stack-dragging' : ''}`}
        key={stack.id}
        style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}
        onPointerDown={(event) => beginDrag(event, source, stack, true)}
        aria-label={`${chips.length} chip stack worth ${money(chipTotal([{ ...stack, chips }]))}`}
      >
        {chips.map((chip, index) => (
          <button
            className={`poker-chip chip-${chip.color} ${index === chips.length - 1 ? 'chip-top' : ''}`}
            key={chip.id}
            type="button"
            style={{ bottom: `${index * CHIP_HEIGHT}rem` }}
            onPointerDown={(event) => { event.stopPropagation(); beginDrag(event, source, stack, index !== chips.length - 1, chip) }}
            aria-label={`${money(chip.value)} ${chip.color} chip`}
          ><img src={chip.picture ?? `/${chip.color}-chip.png`} alt={`${chip.value} chip`} draggable={false} /></button>
        ))}
      </div>
    )
  })

  return (
    <main className="active-hand-shell">
      <header className="active-hand-header">
        <button className="icon-button" type="button" onClick={() => navigate(`/tables/${encodeURIComponent(tableId ?? '')}`)} aria-label="Back to table"><ArrowLeft size={18} /></button>
        <div><p className="active-hand-kicker">HAND {hand.handId.slice(-6)}</p><h1>Private table</h1></div>
        <button className="players-button" type="button" onClick={() => setIsPlayersOpen(true)}><Users size={17} /> Players</button>
      </header>

      <div className="active-table" ref={boardRef}>
        <div className="pot-value"><span>POT</span><strong>{money(currentPot)}</strong></div>
        <div className={`pot-drop-zone ${drag ? 'pot-drop-active' : ''}`} ref={potRef}>
          <div className="pot-chips">{renderStacks(hand.potChips, 'pot')}</div>
        </div>
        {drag && draggedChips().map((chip) => (
          <span className={`poker-chip dragged-chip chip-${chip.color}`} key={`dragged-${chip.id}`} style={{ left: `${drag.position.x * 100}%`, top: `${drag.position.y * 100}%` }}><img src={chip.picture ?? `/${chip.color}-chip.png`} alt={`${chip.value} chip`} draggable={false} /></span>
        ))}
        <div className="table-watermark">CHIPSPOCKET <span>♠ ♣ ♥ ♦</span></div>
        <div className="player-stack-label"><span>YOUR STACK</span><strong>{money(hand.myRemainingStack - selectedAmount)}</strong></div>
        <div className="player-chips">{renderStacks(hand.myStack, 'player')}</div>
        <div className="table-instruction">{isMyTurn ? 'Move chips to the pot to choose your action' : `Waiting for ${hand.players.find((player) => player.id === hand.currentPlayerId)?.name ?? 'another player'}`}</div>
      </div>

      <section className="action-dock" aria-live="polite">
        {!isMyTurn && <p className="waiting-message">Waiting for another player...</p>}
        {submitError && <p className="submit-error" role="alert">{submitError}</p>}
        <button className="primary-button action-button" type="button" onClick={() => { void submitAction() }} disabled={!isMyTurn || isSubmitting}>
          {isSubmitting && <LoaderCircle size={18} className="animate-spin" />}
          {isSubmitting ? 'Loading...' : action}
        </button>
      </section>

      {isPlayersOpen && <PlayersPanel players={hand.players} onClose={() => setIsPlayersOpen(false)} />}
    </main>
  )
}

function PlayersPanel({ players, onClose }: { players: HandPlayer[]; onClose: () => void }) {
  return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="players-panel" role="dialog" aria-modal="true" aria-labelledby="players-title">
      <div className="sheet-header"><div><p className="active-hand-kicker">TABLE ROSTER</p><h2 id="players-title">Players</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close players"><X size={18} /></button></div>
      <div className="players-list">{players.map((player) => <div className="hand-player" key={player.id}><div><strong>{player.name}</strong><span>Seat {player.seat} · {player.role}</span></div><b>{money(player.remainingStack)}</b></div>)}</div>
    </section>
  </div>
}