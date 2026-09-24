import { AlertTriangle, ArrowLeft, CheckCircle2, Plus, Table2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { createTable } from '../../api/tables'
import { getTableJoinToken } from '../../api/tableLobby'

function getCreateTableError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Unable to connect to the server.'
    if (error.response.status === 409) return 'A table with this name already exists.'
    if (error.response.status === 400) return 'Please check the table name and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export function CreateTablePage() {
  const navigate = useNavigate()
  const [tableName, setTableName] = useState('')
  const [bigBlindAmount, setBigBlindAmount] = useState('')
  const [smallBlindAmount, setSmallBlindAmount] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [blindError, setBlindError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = tableName.trim()
    if (!trimmedName) {
      setNameError('Give your table a name.')
      return
    }
    if (trimmedName.length > 255) {
      setNameError('Table name must be 255 characters or fewer.')
      return
    }

    const parsedBigBlind = Number(bigBlindAmount)
    const parsedSmallBlind = Number(smallBlindAmount)
    if (!Number.isInteger(parsedBigBlind) || !Number.isInteger(parsedSmallBlind) || parsedBigBlind <= 0 || parsedSmallBlind <= 0) {
      setBlindError('Enter positive whole-number blind amounts.')
      return
    }
    if (parsedSmallBlind >= parsedBigBlind) {
      setBlindError('The small blind must be lower than the big blind.')
      return
    }

    setNameError(null)
    setBlindError(null)
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    try {
      const createdTable = await createTable({ tableName: trimmedName, bigBlindAmount: parsedBigBlind, smallBlindAmount: parsedSmallBlind })
      const joinToken = await getTableJoinToken(createdTable.id)
      navigate(`/tables/${encodeURIComponent(createdTable.id)}`, { state: { tableName: trimmedName, tableId: createdTable.id, joinToken } })
    } catch (error: unknown) {
      setErrorMessage(getCreateTableError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <div className="mobile-shell">
        <header className="page-header">
          <button className="icon-button" type="button" onClick={() => navigate('/')} aria-label="Back to lobby"><ArrowLeft size={18} strokeWidth={2.2} /></button>
          <div className="page-titlegroup">
            <span className="eyebrow">New table</span>
            <h1>Create Table</h1>
          </div>
        </header>

        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <h2 className="font-['Space_Grotesk'] text-xl font-bold tracking-[-0.04em] text-white">Table information</h2>
            <p className="mt-1 text-sm text-[#a5aaa1]">Give your group a memorable table name.</p>
          </div>

          <div className="form-field">
            <label htmlFor="table-name">Table name</label>
            <div className="input-with-icon">
              <Table2 size={18} strokeWidth={2.1} />
              <input
                className="form-input"
                id="table-name"
                name="tableName"
                maxLength={255}
                placeholder="Friday Night Poker"
                value={tableName}
                onChange={(event) => { setTableName(event.target.value); setNameError(null); setErrorMessage(null); setSuccessMessage(null) }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="form-field">
              <label htmlFor="small-blind">Small blind</label>
              <input
                className="form-input"
                id="small-blind"
                name="smallBlindAmount"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                value={smallBlindAmount}
                onChange={(event) => { setSmallBlindAmount(event.target.value); setBlindError(null); setErrorMessage(null) }}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-field">
              <label htmlFor="big-blind">Big blind</label>
              <input
                className="form-input"
                id="big-blind"
                name="bigBlindAmount"
                type="number"
                min="1"
                step="1"
                placeholder="2"
                value={bigBlindAmount}
                onChange={(event) => { setBigBlindAmount(event.target.value); setBlindError(null); setErrorMessage(null) }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {nameError && <div className="form-error mt-3" role="alert"><span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span><span>{nameError}</span></div>}
          {blindError && <div className="form-error mt-3" role="alert"><span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span><span>{blindError}</span></div>}
          {errorMessage && <div className="form-error mt-3" role="alert"><span aria-hidden="true"><AlertTriangle size={16} strokeWidth={2.3} /></span><span>{errorMessage}</span></div>}
          {successMessage && <div className="form-success mt-3" role="status"><span aria-hidden="true"><CheckCircle2 size={16} strokeWidth={2.4} /></span><span>{successMessage}</span></div>}

          <button className="primary-button mt-5" type="submit" disabled={isSubmitting}><Plus size={18} strokeWidth={2.3} /><span>{isSubmitting ? 'Creating table...' : 'Create Table'}</span></button>
        </form>
      </div>
    </main>
  )
}