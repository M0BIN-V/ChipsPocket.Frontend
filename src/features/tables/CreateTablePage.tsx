import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { chipAppearanceService } from './chipAppearanceService'
import type { ChipAppearance, CreateTableRequest, SelectedChip } from './table.types'

const MIN_SEATS = 2
const MAX_SEATS = 10

function ChipMark({ appearance }: { appearance: ChipAppearance }) {
  return <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white/10 text-[3.4rem] leading-none" style={{ color: appearance.color }} aria-hidden="true">{appearance.picture}</span>
}

export function CreateTablePage() {
  const navigate = useNavigate()
  const [tableName, setTableName] = useState('')
  const [seatCount, setSeatCount] = useState(6)
  const [appearances, setAppearances] = useState<ChipAppearance[]>([])
  const [selectedChips, setSelectedChips] = useState<SelectedChip[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [editingAppearance, setEditingAppearance] = useState<ChipAppearance | null>(null)
  const [chipValue, setChipValue] = useState('')
  const [errors, setErrors] = useState<{ tableName?: string; seatCount?: string; chips?: string; chipValue?: string }>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => { chipAppearanceService.getAll().then(setAppearances) }, [])

  function chooseAppearance(appearance: ChipAppearance) {
    setEditingAppearance(appearance)
    setChipValue('')
    setIsPickerOpen(false)
    setErrors((current) => ({ ...current, chipValue: undefined }))
  }

  function saveChip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(chipValue)
    if (!Number.isInteger(value) || value <= 0) { setErrors((current) => ({ ...current, chipValue: 'Enter a whole number greater than 0.' })); return }
    if (!editingAppearance) return
    setSelectedChips((current) => {
      const existing = current.some((chip) => chip.appearanceId === editingAppearance.id)
      if (existing) return current.map((chip) => chip.appearanceId === editingAppearance.id ? { ...chip, value } : chip)
      return [...current, { appearanceId: editingAppearance.id, appearance: editingAppearance, value }]
    })
    setEditingAppearance(null)
    setChipValue('')
    setErrors((current) => ({ ...current, chipValue: undefined, chips: undefined }))
  }

  function editChip(chip: SelectedChip) { setEditingAppearance(chip.appearance); setChipValue(String(chip.value)); setSuccessMessage(null) }
  function removeChip(appearanceId: string) { setSelectedChips((current) => current.filter((chip) => chip.appearanceId !== appearanceId)); setSuccessMessage(null) }

  function validateAndSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: { tableName?: string; seatCount?: string; chips?: string } = {}
    const trimmedName = tableName.trim()
    if (!trimmedName) nextErrors.tableName = 'Give your table a name.'
    else if (trimmedName.length > 255) nextErrors.tableName = 'Table name must be 255 characters or fewer.'
    if (seatCount < MIN_SEATS || seatCount > MAX_SEATS) nextErrors.seatCount = `Choose between ${MIN_SEATS} and ${MAX_SEATS} seats.`
    if (selectedChips.length === 0) nextErrors.chips = 'Add at least one chip.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    const request: CreateTableRequest = { tableName: trimmedName, seatCount, chips: selectedChips.map(({ appearanceId, value }) => ({ appearanceId, value })) }
    console.log('Create table request', request)
    setSuccessMessage('Table details are ready. API connection coming soon.')
  }

  const availableAppearances = appearances.filter((appearance) => !selectedChips.some((chip) => chip.appearanceId === appearance.id))

  return (
    <main className="min-h-screen bg-[#111311] px-5 py-6 text-[#f7f6f2] sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        <header className="flex items-center gap-3"><button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xl text-[#c3c8bd] transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={() => navigate('/authenticated')} aria-label="Back to home">←</button><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b7d334]">New table</p><h1 className="font-['Space_Grotesk'] text-2xl font-bold">Create Table</h1></div></header>
        <form className="mt-9 space-y-8 pb-8" onSubmit={validateAndSubmit} noValidate>
          <section><h2 className="font-['Space_Grotesk'] text-lg font-semibold">Table information</h2><div className="mt-4 rounded-2xl border border-white/10 bg-[#1a1d19] p-4"><label className="block text-sm font-medium text-[#d8dbd3]" htmlFor="table-name">Table name</label><input className={`mt-2 h-12 w-full rounded-xl border bg-[#111311] px-4 text-base outline-none transition placeholder:text-[#6f756c] focus:ring-2 focus:ring-[#b7d334]/20 ${errors.tableName ? 'border-[#e27350]' : 'border-white/10 focus:border-[#b7d334]'}`} id="table-name" maxLength={255} placeholder="Friday Night Poker" value={tableName} onChange={(event) => setTableName(event.target.value)} />{errors.tableName && <p className="mt-2 text-sm text-[#ffad93]" role="alert">{errors.tableName}</p>}<div className="mt-6 flex items-center justify-between"><div><label className="block text-sm font-medium text-[#d8dbd3]" htmlFor="seat-count">Seats</label><p className="mt-1 text-xs text-[#7f8779]">How many players can join?</p></div><div className="flex items-center gap-4"><button className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-xl transition hover:border-[#b7d334] disabled:opacity-40" type="button" onClick={() => setSeatCount((count) => Math.max(MIN_SEATS, count - 1))} disabled={seatCount <= MIN_SEATS} aria-label="Decrease seats">-</button><output className="w-6 text-center font-['Space_Grotesk'] text-xl font-bold" id="seat-count">{seatCount}</output><button className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-xl transition hover:border-[#b7d334] disabled:opacity-40" type="button" onClick={() => setSeatCount((count) => Math.min(MAX_SEATS, count + 1))} disabled={seatCount >= MAX_SEATS} aria-label="Increase seats">+</button></div></div>{errors.seatCount && <p className="mt-2 text-sm text-[#ffad93]" role="alert">{errors.seatCount}</p>}</div></section>
          <section><div className="flex items-end justify-between"><div><h2 className="font-['Space_Grotesk'] text-lg font-semibold">Chips</h2><p className="mt-1 text-sm text-[#8e968a]">Assign a value to each physical chip.</p></div><span className="text-sm text-[#7f8779]">{selectedChips.length} added</span></div><div className="mt-4 space-y-3">{selectedChips.length === 0 && <div className={`rounded-2xl border border-dashed px-4 py-8 text-center ${errors.chips ? 'border-[#e27350]/70' : 'border-white/15'}`}><p className="text-sm text-[#8e968a]">No chips added yet</p><button className="mt-4 rounded-xl bg-[#b7d334] px-5 py-3 text-sm font-semibold text-[#151712] transition hover:bg-[#c9e34e]" type="button" onClick={() => setIsPickerOpen(true)}>+ Add Chip</button></div>}{selectedChips.map((chip) => <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1d19] p-4" key={chip.appearanceId}><ChipMark appearance={chip.appearance} /><div className="min-w-0 flex-1"><p className="font-semibold">{chip.appearance.name} chip</p><p className="mt-1 text-sm text-[#b7d334]">${chip.value}</p></div><button className="rounded-lg px-2 py-2 text-sm font-semibold text-[#d9ed7a] hover:bg-white/5" type="button" onClick={() => editChip(chip)}>Edit</button><button className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-[#8e968a] hover:bg-[#e27350]/10 hover:text-[#ffad93]" type="button" onClick={() => removeChip(chip.appearanceId)} aria-label={`Remove ${chip.appearance.name} chip`}>x</button></div>)}{selectedChips.length > 0 && <button className="flex min-h-12 w-full items-center justify-center rounded-xl border border-dashed border-white/15 text-sm font-semibold text-[#d9ed7a] transition hover:border-[#b7d334]" type="button" onClick={() => setIsPickerOpen(true)}>+ Add another chip</button>}{errors.chips && <p className="text-sm text-[#ffad93]" role="alert">{errors.chips}</p>}</div></section>
          {successMessage && <p className="rounded-xl border border-[#b7d334]/30 bg-[#b7d334]/10 px-4 py-3 text-sm text-[#d9ed7a]" role="status">{successMessage}</p>}<button className="w-full rounded-xl bg-[#b7d334] px-4 py-3.5 font-semibold text-[#151712] transition hover:bg-[#c9e34e] focus:outline-none focus:ring-2 focus:ring-[#d9ed7a] focus:ring-offset-2 focus:ring-offset-[#111311]" type="submit">Create Table</button>
        </form>
      </div>
      {isPickerOpen && <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsPickerOpen(false) }}><section className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#1a1d19] p-5 pb-8 sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="chip-picker-title"><div className="flex items-center justify-between"><h2 className="font-['Space_Grotesk'] text-xl font-bold" id="chip-picker-title">Choose chip</h2><button className="h-10 w-10 rounded-full text-xl text-[#8e968a] hover:bg-white/5" type="button" onClick={() => setIsPickerOpen(false)} aria-label="Close chip picker">x</button></div><div className="mt-5 grid grid-cols-2 gap-3">{availableAppearances.map((appearance) => <button className="flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-[#111311] px-3 text-left transition hover:border-[#b7d334]" key={appearance.id} type="button" onClick={() => chooseAppearance(appearance)}><ChipMark appearance={appearance} /><span className="font-semibold">{appearance.name}</span></button>)}</div>{availableAppearances.length === 0 && <p className="py-8 text-center text-sm text-[#8e968a]">All chip appearances are already in use.</p>}</section></div>}
      {editingAppearance && <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-5"><form className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#1a1d19] p-5 pb-8 sm:rounded-3xl" onSubmit={saveChip}><div className="flex items-center gap-3"><ChipMark appearance={editingAppearance} /><div><p className="text-xs uppercase tracking-[0.15em] text-[#b7d334]">Chip value</p><h2 className="font-['Space_Grotesk'] text-xl font-bold">{editingAppearance.name} chip</h2></div></div><label className="mt-6 block text-sm font-medium text-[#d8dbd3]" htmlFor="chip-value">Value</label><div className="relative mt-2"><span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#8e968a]">$</span><input className="h-12 w-full rounded-xl border border-white/10 bg-[#111311] pl-9 pr-4 text-base outline-none focus:border-[#b7d334] focus:ring-2 focus:ring-[#b7d334]/20" id="chip-value" type="number" min="1" step="1" inputMode="numeric" autoFocus value={chipValue} onChange={(event) => setChipValue(event.target.value)} /></div>{errors.chipValue && <p className="mt-2 text-sm text-[#ffad93]" role="alert">{errors.chipValue}</p>}<div className="mt-6 flex gap-3"><button className="h-12 flex-1 rounded-xl border border-white/10 font-semibold text-[#c3c8bd]" type="button" onClick={() => setEditingAppearance(null)}>Cancel</button><button className="h-12 flex-1 rounded-xl bg-[#b7d334] font-semibold text-[#151712]" type="submit">Add Chip</button></div></form></div>}
    </main>
  )
}