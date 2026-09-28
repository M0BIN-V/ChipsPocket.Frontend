import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowLeftRight, LoaderCircle, Minus, Plus, Sparkles, Undo2, Users, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { getMe } from '../../api/auth'
import { getUserStack } from '../../api/buyIn'
import { mockHandService } from '../../api/handService'
import { chipAppearanceService } from './chipAppearanceService'
import { canAddReplacementChip, canConfirmChipChange, getAutoFillReplacementCounts, getChipValueTotal, mockChipChangeService } from './chipChangeService'
import { getAvailableAction } from './handAction'
import type { Chip, ChipColor, ChipStack, HandPlayer, HandState } from './hand.types'
import type { ChipAppearance, UserStackResponse } from './table.types'

const STACK_SNAP_DISTANCE = 0.06
const CHIP_HEIGHT = 0.9

type StackSource = 'player' | 'pot'
interface DragState {
  source: StackSource
  stackId: string
  chipIds: string[]
  originalPosition: { x: number; y: number }
  viewportPosition: { x: number; y: number }
  grabOffset: { x: number; y: number }
  moveStack: boolean
  isOverChangeZone: boolean
}

interface ReturningChip {
  chip: Chip
  startX: number
  startY: number
  deltaX: number
  deltaY: number
  delay: number
}

interface ChipMenuState {
  sourceChipIds: string[]
  stackChipIds: string[]
  selectedChipId: string
  left: number
  top: number
  mode: 'actions' | 'change'
}

interface LongPressState {
  timer: number
  pointerId: number
  startX: number
  startY: number
}

function money(value: number) {
  return `$${value.toLocaleString('en-US')}`
}

function chipTotal(stacks: ChipStack[]) {
  return stacks.reduce((total, stack) => total + stack.chips.reduce((stackTotal, chip) => stackTotal + chip.value, 0), 0)
}

function myContribution(stacks: ChipStack[]) {
  return stacks.reduce((total, stack) => total + stack.chips.reduce((stackTotal, chip) => stackTotal + (chip.isMine ? chip.value : 0), 0), 0)
}

function chipColor(name: string, picture: string): ChipColor {
  const source = `${name} ${picture}`.toLowerCase()
  if (source.includes('red')) return 'red'
  if (source.includes('green')) return 'green'
  if (source.includes('yellow')) return 'yellow'
  if (source.includes('blue')) return 'blue'
  return 'black'
}

function chipPicture(name: string, picture: string, color: ChipColor): string {
  if (/^(https?:|data:|\/)/i.test(picture)) return picture
  const source = (picture || name).toLowerCase().replace(/\s+/g, '-')
  return `/${source.includes('chip') ? source : `${source || color}-chip`}.png`
}

function buildPlayerChips(stack: UserStackResponse): Chip[] {
  return stack.chips.flatMap((stackChip) => Array.from({ length: stackChip.count }, (_, index) => ({
    id: `${stackChip.chipId}-${index}`,
    color: chipColor(stackChip.name, stackChip.picture),
    value: stackChip.value,
    picture: chipPicture(stackChip.name, stackChip.picture, chipColor(stackChip.name, stackChip.picture)),
    isMine: true,
  })))
}

export function ActiveHandPage() {
  const navigate = useNavigate()
  const { tableId, handId } = useParams<{ tableId: string; handId: string }>()
  const [hand, setHand] = useState<HandState | null>(null)
  const [chipAppearances, setChipAppearances] = useState<ChipAppearance[]>([])
  const [chipAppearancesError, setChipAppearancesError] = useState(false)
  const [isPlayersOpen, setIsPlayersOpen] = useState(false)
  const [chipMenu, setChipMenu] = useState<ChipMenuState | null>(null)
  const [selectedDenominations, setSelectedDenominations] = useState<Record<string, number>>({})
  const [drag, setDrag] = useState<DragState | null>(null)
  const [returningChips, setReturningChips] = useState<ReturningChip[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const potRef = useRef<HTMLDivElement>(null)
  const changeZoneRef = useRef<HTMLButtonElement | null>(null)
  const longPressRef = useRef<LongPressState | null>(null)

  useEffect(() => {
    let mounted = true
    void chipAppearanceService.getAll().then((appearances) => {
      if (mounted) setChipAppearances(appearances)
    }).catch(() => {
      if (mounted) setChipAppearancesError(true)
    })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    function dismissMenu(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest('[data-chip-change-menu]')) return
      setChipMenu(null)
    }
    document.addEventListener('pointerdown', dismissMenu)
    return () => document.removeEventListener('pointerdown', dismissMenu)
  }, [])

  useEffect(() => {
    if (chipMenu?.mode !== 'change') return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setChipMenu(null)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [chipMenu?.mode])

  useEffect(() => {
    if (!handId || !tableId) return
    let mounted = true
    void mockHandService.getHandState(handId, tableId).then(async (state) => {
      if (!mounted) return
      try {
        const user = await getMe()
        const userStack = await getUserStack(tableId, user.id)
        const chips = buildPlayerChips(userStack)
        setHand({ ...state, myStack: chips.length > 0 ? [{ id: 'user-stack', chips, position: { x: 0.5, y: 0.76 } }] : [] })
      } catch {
        setHand(state)
        setSubmitError('Unable to load your chips.')
      }
    })
    return () => { mounted = false }
  }, [handId, tableId])

  function clearLongPress() {
    if (longPressRef.current) window.clearTimeout(longPressRef.current.timer)
    longPressRef.current = null
  }

  function getDropTarget(clientX: number, clientY: number) {
    const potRect = potRef.current?.getBoundingClientRect()
    return Boolean(potRect && clientX >= potRect.left && clientX <= potRect.right && clientY >= potRect.top && clientY <= potRect.bottom)
  }

  function findSnapTarget(stacks: ChipStack[], sourceStackId: string, position: { x: number; y: number }) {
    const board = boardRef.current?.getBoundingClientRect()
    if (!board) return undefined
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const chipOffset = CHIP_HEIGHT * rootFontSize / board.height
    return stacks.find((stack) => {
      if (stack.id === sourceStackId) return false
      return stack.chips.some((_, index) => Math.hypot(stack.position.x - position.x, stack.position.y - index * chipOffset - position.y) < STACK_SNAP_DISTANCE)
    })
  }

  function finishDrag(clientX: number, clientY: number, cancelled = false) {
    if (!drag) return
    const currentHand = hand
    if (!currentHand) { setDrag(null); return }

    if (cancelled) {
      animateDragBack(drag, currentHand)
      setDrag(null)
      clearLongPress()
      return
    }

    const changeZone = changeZoneRef.current?.getBoundingClientRect()
    const isOverChangeZone = Boolean(changeZone && (
      clientX >= changeZone.left && clientX <= changeZone.right &&
      clientY >= changeZone.top && clientY <= changeZone.bottom
    ))
    if (isOverChangeZone) {
      const sourceStacks = drag.source === 'player' ? currentHand.myStack : currentHand.potChips
      const sourceStack = sourceStacks.find((stack) => stack.id === drag.stackId)
      const sourceChipIds = drag.chipIds.length > 0 ? drag.chipIds : sourceStack?.chips.map((chip) => chip.id) ?? []
      const stackChipIds = sourceStack?.chips.map((chip) => chip.id) ?? sourceChipIds
      setDrag(null)
      if (sourceChipIds.length > 0) {
        setSelectedDenominations({})
        setChipMenu({
          sourceChipIds,
          stackChipIds,
          selectedChipId: sourceChipIds[0],
          left: 0,
          top: 0,
          mode: 'change',
        })
      }
      return
    }

    const board = boardRef.current?.getBoundingClientRect()
    const isOverTable = Boolean(board && clientX >= board.left && clientX <= board.right && clientY >= board.top && clientY <= board.bottom)
    if (!isOverTable || !board) {
      animateDragBack(drag, currentHand)
      setDrag(null)
      return
    }

    const sourceStacks = drag.source === 'player' ? currentHand.myStack : currentHand.potChips
    const sourceStack = sourceStacks.find((stack) => stack.id === drag.stackId)
    if (!sourceStack) { setDrag(null); return }
    const draggedChips = sourceStack.chips.filter((chip) => drag.chipIds.includes(chip.id))
    const remainingChips = sourceStack.chips.filter((chip) => !drag.chipIds.includes(chip.id))
    const destination: StackSource = getDropTarget(clientX, clientY) ? 'pot' : 'player'
    const destinationStacks = destination === 'player' ? currentHand.myStack : currentHand.potChips
    const releasePosition = {
      x: (clientX - board.left - drag.grabOffset.x) / board.width,
      y: (clientY - board.top - drag.grabOffset.y) / board.height,
    }
    const position = {
      x: releasePosition.x,
      y: releasePosition.y,
    }
    const target = destination === 'pot' ? undefined : findSnapTarget(destinationStacks, sourceStack.id, position)
    const keptSource = remainingChips.length > 0 ? [{ ...sourceStack, chips: remainingChips }] : []
    const withoutSource = sourceStacks.filter((stack) => stack.id !== sourceStack.id)
    const remainingSourceStacks = [...withoutSource, ...keptSource]
    const nextDestination = destination === drag.source ? withoutSource : destinationStacks
    const mergedDestination = target
      ? nextDestination.map((stack) => stack.id === target.id ? { ...stack, chips: [...stack.chips, ...draggedChips] } : stack)
      : [...nextDestination, { id: `${destination}-stack-${draggedChips.map((chip) => chip.id).join('-')}`, chips: draggedChips, position }]
    const nextPlayerStacks = drag.source === 'player'
      ? destination === 'player' ? [...keptSource, ...mergedDestination] : remainingSourceStacks
      : destination === 'player' ? mergedDestination : currentHand.myStack
    const nextPotStacks = drag.source === 'pot'
      ? destination === 'pot' ? [...keptSource, ...mergedDestination] : remainingSourceStacks
      : destination === 'pot' ? mergedDestination : currentHand.potChips
    setHand({ ...currentHand, myStack: nextPlayerStacks, potChips: nextPotStacks })
    setDrag(null)
  }

  function animateDragBack(currentDrag: DragState, currentHand: HandState) {
    const sourceStacks = currentDrag.source === 'player' ? currentHand.myStack : currentHand.potChips
    const sourceStack = sourceStacks.find((stack) => stack.id === currentDrag.stackId)
    const board = boardRef.current?.getBoundingClientRect()
    if (!sourceStack || !board) return
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const chipSize = 4.6 * rootFontSize
    const chipOffset = CHIP_HEIGHT * rootFontSize
    const chips = sourceStack.chips.filter((chip) => currentDrag.chipIds.includes(chip.id))
    setReturningChips(chips.map((chip, index) => {
      const stackOffset = currentDrag.moveStack ? index * chipOffset : 0
      const startX = currentDrag.viewportPosition.x - chipSize / 2
      const startY = currentDrag.viewportPosition.y - chipSize / 2 - stackOffset
      const targetX = board.left + board.width * currentDrag.originalPosition.x - chipSize / 2
      const targetY = board.top + board.height * currentDrag.originalPosition.y - chipSize / 2 - stackOffset
      return {
        chip,
        startX,
        startY,
        deltaX: targetX - startX,
        deltaY: targetY - startY,
        delay: index * 28,
      }
    }))
  }

  useEffect(() => {
    if (!drag) return
    function move(event: PointerEvent) {
      if (!boardRef.current) return
      const zone = changeZoneRef.current?.getBoundingClientRect()
      const isOverChangeZone = Boolean(zone && (
        event.clientX >= zone.left && event.clientX <= zone.right &&
        event.clientY >= zone.top && event.clientY <= zone.bottom
      ))
      setDrag((current) => current && {
        ...current,
        isOverChangeZone,
        viewportPosition: { x: event.clientX - current.grabOffset.x, y: event.clientY - current.grabOffset.y },
      })
    }
    function handlePointerUp(event: PointerEvent) {
      finishDrag(event.clientX, event.clientY, false)
    }
    function handlePointerCancel(event: PointerEvent) {
      finishDrag(event.clientX, event.clientY, true)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag])

  if (!hand) {
    return <main className="app-shell active-hand-loading"><LoaderCircle size={26} className="animate-spin" aria-label="Loading hand" /></main>
  }

  const currentPot = chipTotal(hand.potChips)
  const selectedAmount = myContribution(hand.potChips)
  const action = getAvailableAction(hand, selectedAmount)
  const actionLabel = selectedAmount > 0 && (action === 'CALL' || action === 'RAISE')
    ? `${action} ${money(selectedAmount)}`
    : action
  const isMyTurn = hand.currentPlayerId === hand.myPlayerId
  const menuChips = chipMenu ? hand.myStack.flatMap((stack) => stack.chips).filter((chip) => chipMenu.sourceChipIds.includes(chip.id)) : []
  const sourceTotal = getChipValueTotal(menuChips)
  const sourceGroups = menuChips.reduce<{ chip: Chip; count: number }[]>((groups, chip) => {
    const existing = groups.find((group) => group.chip.value === chip.value && group.chip.picture === chip.picture)
    if (existing) existing.count += 1
    else groups.push({ chip, count: 1 })
    return groups
  }, [])
  const menuAppearances = menuChips.length > 0
    ? chipAppearances.filter((appearance) => appearance.value > 0 && appearance.value <= sourceTotal).sort((first, second) => second.value - first.value)
    : []
  const selectedTotal = chipAppearances.reduce((total, appearance) => total + appearance.value * (selectedDenominations[appearance.id] ?? 0), 0)
  const remainingValue = sourceTotal - selectedTotal
  const autoFillCounts = getAutoFillReplacementCounts(sourceTotal, selectedTotal, menuAppearances)

  function autoFillRemainingValue() {
    if (!autoFillCounts) return
    setSelectedDenominations((current) => {
      const next = { ...current }
      Object.entries(autoFillCounts).forEach(([denominationId, count]) => {
        next[denominationId] = (next[denominationId] ?? 0) + count
      })
      return next
    })
  }

  function beginDrag(event: React.PointerEvent, source: StackSource, stack: ChipStack, moveStack: boolean, selectedChip = stack.chips[stack.chips.length - 1]) {
    if (!isMyTurn || source === 'pot' && !selectedChip?.isMine) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const board = boardRef.current?.getBoundingClientRect()
    const target = event.currentTarget.getBoundingClientRect()
    if (!board) return
    const originalPosition = moveStack
      ? stack.position
      : { x: (target.left + target.width / 2 - board.left) / board.width, y: (target.top + target.height / 2 - board.top) / board.height }
    const targetCenter = { x: target.left + target.width / 2, y: target.top + target.height / 2 }
    const chipIds = moveStack
      ? stack.chips.filter((chip) => source !== 'pot' || chip.isMine).map((chip) => chip.id)
      : [selectedChip.id]
    if (chipIds.length === 0) return
    setDrag({
      source,
      stackId: stack.id,
      chipIds,
      originalPosition,
      viewportPosition: targetCenter,
      grabOffset: { x: event.clientX - targetCenter.x, y: event.clientY - targetCenter.y },
      moveStack,
      isOverChangeZone: false,
    })
  }

  function showChipMenu(sourceChipIds: string[], stackChipIds: string[], selectedChipId: string, clientX: number, clientY: number) {
    const board = boardRef.current?.getBoundingClientRect()
    if (!board) return
    const pointerX = Number.isFinite(clientX) ? clientX : board.left + 8
    const pointerY = Number.isFinite(clientY) ? clientY : board.top + 8
    const left = Math.max(8, Math.min(board.width - 308, pointerX - board.left))
    const top = Math.max(8, Math.min(board.height - 430, pointerY - board.top))
    setChipMenu({ sourceChipIds, stackChipIds, selectedChipId, left, top, mode: 'actions' })
  }

  function handleChipPointerDown(event: React.PointerEvent<HTMLButtonElement>, source: StackSource, stack: ChipStack, moveStack: boolean, chip: Chip) {
    event.stopPropagation()
    beginDrag(event, source, stack, moveStack, chip)
    if (source !== 'player' || !chip.isMine || event.pointerType === 'mouse') return
    clearLongPress()
    const { clientX, clientY, pointerId } = event
    const timer = window.setTimeout(() => {
      longPressRef.current = null
    }, 520)
    longPressRef.current = { timer, pointerId, startX: clientX, startY: clientY }
  }

  function handleChipPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const pendingPress = longPressRef.current
    if (!pendingPress || pendingPress.pointerId !== event.pointerId) return
    if (Math.hypot(event.clientX - pendingPress.startX, event.clientY - pendingPress.startY) > 10) clearLongPress()
  }

  function handleChipContextMenu(event: React.MouseEvent<HTMLButtonElement>, source: StackSource, stack: ChipStack, chip: Chip) {
    if (source !== 'player' || !chip.isMine) return
    event.preventDefault()
    event.stopPropagation()
    clearLongPress()
    setDrag(null)
    showChipMenu([chip.id], stack.chips.map((stackChip) => stackChip.id), chip.id, event.clientX, event.clientY)
  }

  function handleStackContextMenu(event: React.MouseEvent<HTMLDivElement>, source: StackSource, stack: ChipStack) {
    if (source !== 'player' || event.target !== event.currentTarget) return
    const sourceChipIds = stack.chips.filter((chip) => chip.isMine).map((chip) => chip.id)
    if (sourceChipIds.length === 0) return
    event.preventDefault()
    clearLongPress()
    setDrag(null)
    showChipMenu(sourceChipIds, sourceChipIds, sourceChipIds[0], event.clientX, event.clientY)
  }

  function confirmChipChange() {
    if (!hand || !chipMenu) return
    const replacements = chipAppearances.flatMap((appearance) => Array.from(
      { length: selectedDenominations[appearance.id] ?? 0 },
      () => ({
        id: `changed-${crypto.randomUUID()}`,
        color: chipColor(appearance.name, appearance.picture),
        value: appearance.value,
        picture: chipPicture(appearance.name, appearance.picture, chipColor(appearance.name, appearance.picture)),
        isMine: true,
      }),
    ))
    try {
      setHand(mockChipChangeService.change(hand, chipMenu.sourceChipIds, replacements))
      setChipMenu(null)
      setSelectedDenominations({})
    } catch {
      setSubmitError('Unable to change this chip.')
    }
  }

  function visibleChips(stack: ChipStack) {
    const returningChipIds = new Set(returningChips.map(({ chip }) => chip.id))
    if (returningChipIds.size > 0) {
      return stack.chips.filter((chip) => !returningChipIds.has(chip.id))
    }
    if (!drag || drag.stackId !== stack.id || drag.source !== 'player' && drag.source !== 'pot') return stack.chips
    if (drag.moveStack) return stack.chips
    return stack.chips.filter((chip) => !drag.chipIds.includes(chip.id))
  }

  function draggedChips(): Chip[] {
    if (!drag || !hand) return []
    const stacks = drag.source === 'player' ? hand.myStack : hand.potChips
    return stacks.find((stack) => stack.id === drag.stackId)?.chips.filter((chip) => drag.chipIds.includes(chip.id)) ?? []
  }

  function renderDragOverlay() {
    if (!drag) return null
    const chips = draggedChips()
    if (chips.length === 0) return null
    return createPortal(
      <div
        className={`drag-overlay-stack ${drag.moveStack ? 'drag-overlay-multiple' : ''}`}
        style={{ left: drag.viewportPosition.x, top: drag.viewportPosition.y }}
      >
        {chips.map((chip, index) => (
          <span className="drag-overlay-chip" key={`drag-overlay-${chip.id}`} style={{ bottom: `${index * CHIP_HEIGHT}rem` }}>
            <img src={chip.picture ?? `/${chip.color}-chip.png`} alt={`${chip.value} chip`} draggable={false} />
          </span>
        ))}
      </div>,
      document.body,
    )
  }

  function arrangeChips() {
    setHand((currentHand) => {
      if (!currentHand) return currentHand
      const groups = new Map<string, Chip[]>()
      currentHand.myStack.flatMap((stack) => stack.chips).forEach((chip) => {
        const key = `${chip.color}-${chip.value}`
        groups.set(key, [...(groups.get(key) ?? []), chip])
      })
      const groupedStacks = [...groups.entries()]
        .sort(([, firstChips], [, secondChips]) => secondChips[0].value - firstChips[0].value)
      const isCompactTable = (boardRef.current?.clientWidth ?? 0) < 520
      const columns = isCompactTable ? Math.min(3, groupedStacks.length) : groupedStacks.length
      const rows = Math.ceil(groupedStacks.length / Math.max(columns, 1))
      const arrangedStacks = groupedStacks.map(([key, chips], index) => {
        const row = Math.floor(index / Math.max(columns, 1))
        const column = index % Math.max(columns, 1)
        return {
          id: `arranged-${key}`,
          chips,
          position: {
            x: columns === 1 ? 0.5 : isCompactTable ? 0.18 + column * (0.64 / (columns - 1)) : 0.3 + index * (0.4 / (groupedStacks.length - 1)),
            y: isCompactTable && rows > 1 ? 0.68 + row * (0.2 / (rows - 1)) : 0.78,
          },
        }
      })
      return { ...currentHand, myStack: arrangedStacks }
    })
    setDrag(null)
  }

  function cancelContribution() {
    if (!hand || isSubmitting || selectedAmount === 0) return
    const returnedChips = hand.potChips.flatMap((stack) => stack.chips.filter((chip) => chip.isMine))
    const remainingPotStacks = hand.potChips
      .map((stack) => ({ ...stack, chips: stack.chips.filter((chip) => !chip.isMine) }))
      .filter((stack) => stack.chips.length > 0)
    const returnedStack = hand.myStack.find((stack) => stack.id === 'returned-stack')
    const targetPosition = returnedStack?.position ?? { x: 0.5, y: 0.78 }
    const board = boardRef.current
    const boardRect = board?.getBoundingClientRect()
    const chipElements = board ? Array.from(board.querySelectorAll<HTMLElement>('[data-chip-id]')) : []
    const animations = boardRect ? returnedChips.flatMap((chip, index) => {
      const chipElement = chipElements.find((element) => element.dataset.chipId === chip.id)
      if (!chipElement) return []
      const chipRect = chipElement.getBoundingClientRect()
      const startX = chipRect.left
      const startY = chipRect.top
      const targetX = boardRect.left + boardRect.width * targetPosition.x - chipRect.width / 2
      const targetY = boardRect.top + boardRect.height * targetPosition.y - chipRect.height / 2
      return [{
        chip,
        startX,
        startY,
        deltaX: targetX - startX,
        deltaY: targetY - startY,
        delay: index * 28,
      }]
    }) : []
    const nextPlayerStacks = returnedStack
      ? hand.myStack.map((stack) => stack.id === 'returned-stack' ? { ...stack, chips: [...stack.chips, ...returnedChips] } : stack)
      : [...hand.myStack, {
        id: 'returned-stack',
        chips: returnedChips,
        position: { x: 0.5, y: 0.78 },
      }]
    setReturningChips(animations)
    setHand({
      ...hand,
      myStack: nextPlayerStacks,
      potChips: remainingPotStacks,
    })
    setSubmitError(null)
  }

  function handleTableDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    arrangeChips()
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
    return (
      <div
        className={`chip-stack ${chips.length === 1 ? 'chip-stack-single' : ''} ${isDragged ? 'chip-stack-dragging' : ''}`}
        key={stack.id}
        style={{ left: `${stack.position.x * 100}%`, top: `${stack.position.y * 100}%` }}
        onPointerDown={(event) => beginDrag(event, source, stack, true)}
        onContextMenu={(event) => handleStackContextMenu(event, source, stack)}
        aria-label={`${stack.chips.length} chip stack worth ${money(chipTotal([stack]))}`}
      >
        {chips.map((chip, index) => (
          <button
            className={`poker-chip chip-${chip.color} ${index === chips.length - 1 ? 'chip-top' : ''}`}
            key={chip.id}
            data-chip-id={chip.id}
            type="button"
            style={{ bottom: `${index * CHIP_HEIGHT}rem` }}
            onPointerDown={(event) => handleChipPointerDown(event, source, stack, index !== chips.length - 1, chip)}
            onPointerMove={handleChipPointerMove}
            onPointerUp={clearLongPress}
            onPointerCancel={clearLongPress}
            onContextMenu={(event) => handleChipContextMenu(event, source, stack, chip)}
            aria-label={`${money(chip.value)} ${chip.color} chip`}
          ><img src={chip.picture ?? `/${chip.color}-chip.png`} alt={`${chip.value} chip`} draggable={false} /></button>
        ))}
        {chips.length > 1 && <span className="chip-stack-value">{money(chips.reduce((total, chip) => total + chip.value, 0))}</span>}
      </div>
    )
  })

  return (
    <main className="active-hand-shell">
      <header className="active-hand-header">
        <button className="icon-button" type="button" onClick={() => navigate('/')} aria-label="Back to home"><ArrowLeft size={18} /></button>
        <div><p className="active-hand-kicker">HAND {hand.handId.slice(-6)}</p><h1>Private table</h1></div>
        <button className="players-button" type="button" onClick={() => setIsPlayersOpen(true)}><Users size={17} /> Players</button>
      </header>

      <div className="active-table" ref={boardRef} onDoubleClick={handleTableDoubleClick}>
        <div className="pot-value"><span>POT</span><strong>{money(currentPot)}</strong></div>
        <div className={`pot-drop-zone ${drag ? 'pot-drop-active' : ''}`} ref={potRef}>
          <div className="pot-chips">{renderStacks(hand.potChips, 'pot')}</div>
        </div>
        <div className="table-watermark">CHIPSPOCKET <span>♠ ♣ ♥ ♦</span></div>
        <div className="player-stack-label"><span>YOUR STACK</span><strong>{money(hand.myRemainingStack - selectedAmount)}</strong></div>
        <div className="player-chips">{renderStacks(hand.myStack, 'player')}</div>
        {chipMenu?.mode === 'actions' && menuChips.length > 0 && <div
          className="chip-change-menu chip-context-menu"
          data-chip-change-menu
          role="menu"
          aria-label="Chip actions"
          style={{ left: chipMenu.left, top: chipMenu.top }}
        >
            <button className="chip-menu-action" type="button" role="menuitem" onClick={() => {
              setSelectedDenominations({})
              setChipMenu({ ...chipMenu, mode: 'change' })
            }}>Change</button>
            {chipMenu.sourceChipIds.length === 1 && chipMenu.stackChipIds.length > 1 && <button className="chip-menu-action" type="button" role="menuitem" onClick={() => {
              setSelectedDenominations({})
              setChipMenu({ ...chipMenu, sourceChipIds: chipMenu.stackChipIds, mode: 'change' })
            }}>Change stack</button>}
            {chipMenu.sourceChipIds.length > 1 && <button className="chip-menu-action" type="button" role="menuitem" onClick={() => {
              setSelectedDenominations({})
              setChipMenu({ ...chipMenu, sourceChipIds: [chipMenu.selectedChipId], mode: 'change' })
            }}>Change chip</button>}
        </div>}
        {chipMenu?.mode === 'change' && menuChips.length > 0 && createPortal(<div
          className="chip-change-modal-backdrop"
          data-chip-change-menu
          onPointerDown={(event) => { if (event.target === event.currentTarget) setChipMenu(null) }}
        >
          <section className="chip-change-menu chip-change-panel" role="dialog" aria-modal="true" aria-label="Change chips">
            <div className="chip-change-heading">
              <div><p className="active-hand-kicker">CHIP CHANGE</p><h2>{menuChips.length > 1 ? 'Change chips' : 'Make change'}</h2></div>
              <button className="icon-button" type="button" onClick={() => setChipMenu(null)} aria-label="Close chip change"><X size={17} /></button>
            </div>
            <div className="chip-change-original">
              <div className="chip-change-source-chips">
                {sourceGroups.map(({ chip, count }) => <span className="chip-change-source-group" key={`${chip.value}-${chip.picture}`}>
                  <img src={chip.picture ?? `/${chip.color}-chip.png`} alt="" />
                  <b>{count} × {money(chip.value)}</b>
                </span>)}
              </div>
              <div><span>{menuChips.length > 1 ? 'Total value' : 'Original'}</span><strong>{money(sourceTotal)}</strong></div>
            </div>
            <div className="chip-change-totals" aria-live="polite">
              <span>Selected <strong>{money(selectedTotal)}</strong></span>
              <span>Remaining <strong>{money(remainingValue)}</strong></span>
            </div>
            <div className="chip-change-auto-fill-row">
              <span>Complete remaining value</span>
              <button className="chip-change-auto-fill-button" type="button" disabled={remainingValue <= 0 || autoFillCounts === null} onClick={autoFillRemainingValue}>
                <Sparkles size={15} /> Auto fill
              </button>
            </div>
            <div className="chip-change-denominations" aria-label="Available denominations">
              {chipAppearancesError ? <p className="chip-change-empty">Chip denominations could not be loaded.</p> : menuAppearances.length === 0 ? <p className="chip-change-empty">No replacement denominations available.</p> : menuAppearances.map((appearance) => {
                const count = selectedDenominations[appearance.id] ?? 0
                const disabled = !canAddReplacementChip(sourceTotal, selectedTotal, appearance.value)
                return <button
                  className="chip-denomination"
                  key={appearance.id}
                  type="button"
                  disabled={disabled}
                  aria-label={`Add ${money(appearance.value)} chip`}
                  onClick={() => setSelectedDenominations((current) => ({ ...current, [appearance.id]: (current[appearance.id] ?? 0) + 1 }))}
                >
                  <img src={chipPicture(appearance.name, appearance.picture, chipColor(appearance.name, appearance.picture))} alt="" />
                  <span>{money(appearance.value)}</span>
                  <Plus size={15} />
                  {count > 0 && <b>{count}</b>}
                </button>
              })}
            </div>
            <div className="chip-change-selected">
              <span className="chip-change-label">Replacement chips</span>
              {menuAppearances.filter((appearance) => (selectedDenominations[appearance.id] ?? 0) > 0).map((appearance) => <div className="chip-selected-row" key={appearance.id}>
                <img src={chipPicture(appearance.name, appearance.picture, chipColor(appearance.name, appearance.picture))} alt="" />
                <span>{money(appearance.value)} × {selectedDenominations[appearance.id]}</span>
                <button className="chip-remove-button" type="button" aria-label={`Remove one ${money(appearance.value)} chip`} onClick={() => setSelectedDenominations((current) => {
                  const nextCount = (current[appearance.id] ?? 0) - 1
                  const next = { ...current }
                  if (nextCount > 0) next[appearance.id] = nextCount
                  else delete next[appearance.id]
                  return next
                })}><Minus size={15} /></button>
              </div>)}
              {selectedTotal === 0 && <span className="chip-change-empty">Choose denominations to continue.</span>}
            </div>
            <button className="primary-button chip-change-confirm" type="button" disabled={!canConfirmChipChange(sourceTotal, selectedTotal)} onClick={confirmChipChange}>Confirm change</button>
          </section>
        </div>, document.body)}
        <div className="table-instruction">{isMyTurn ? 'Move chips to the pot to choose your action' : `Waiting for ${hand.players.find((player) => player.id === hand.currentPlayerId)?.name ?? 'another player'}`}</div>
      </div>

      {returningChips.length > 0 && createPortal(returningChips.map(({ chip, startX, startY, deltaX, deltaY, delay }) => (
        <span
          aria-hidden="true"
          className="chip-return-animation"
          key={`returning-${chip.id}`}
          onAnimationEnd={() => setReturningChips((current) => current.filter((returningChip) => returningChip.chip.id !== chip.id))}
          style={{
            left: `${startX}px`,
            top: `${startY}px`,
            '--return-dx': `${deltaX}px`,
            '--return-dy': `${deltaY}px`,
            '--return-delay': `${delay}ms`,
          } as React.CSSProperties}
        ><img src={chip.picture ?? `/${chip.color}-chip.png`} alt="" draggable={false} /></span>
      )), document.body)}
      {renderDragOverlay()}

      <button
        ref={changeZoneRef}
        type="button"
        className={`change-drop-zone ${drag ? 'visible' : ''} ${drag?.isOverChangeZone ? 'active' : ''}`}
        aria-live="polite"
        aria-label={drag?.isOverChangeZone ? 'Release to change chips' : 'Drop here to change chips'}
        aria-hidden={!drag}
      >
        <span className="change-drop-zone-inner">
          <span className="change-drop-icon"><ArrowLeftRight size={24} /></span>
          <span className="change-drop-text">{drag?.isOverChangeZone ? 'RELEASE TO CHANGE' : 'DROP HERE TO CHANGE'}</span>
        </span>
      </button>

      <section className="action-dock" aria-live="polite">
        {!isMyTurn && <p className="waiting-message">Waiting for another player...</p>}
        {submitError && <p className="submit-error" role="alert">{submitError}</p>}
        <div className="action-controls">
          {selectedAmount > 0 && <button className={`icon-button cancel-bet-button ${drag ? 'change-zone-active' : ''}`} type="button" onClick={cancelContribution} disabled={isSubmitting || Boolean(drag)} aria-label="Cancel bet and return chips" aria-hidden={Boolean(drag)} title="Return chips to your stack"><Undo2 size={18} strokeWidth={2.2} /></button>}
          <button className={`primary-button action-button ${drag ? 'change-zone-active' : ''}`} type="button" onClick={() => { void submitAction() }} disabled={!isMyTurn || isSubmitting || Boolean(drag)} aria-hidden={Boolean(drag)}>
            {isSubmitting && <LoaderCircle size={18} className="animate-spin" />}
            {isSubmitting ? 'Loading...' : actionLabel}
          </button>
        </div>
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