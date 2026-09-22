import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { createTable } from '../../api/tables'

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
  const [nameError, setNameError] = useState<string | null>(null)
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

    setNameError(null)
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    try {
      const createdTable = await createTable({ tableName: trimmedName })
      navigate(`/table/${createdTable.id}`, { state: { tableName: trimmedName, tableId: createdTable.id } })
    } catch (error: unknown) {
      setErrorMessage(getCreateTableError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#111311] px-5 py-6 text-[#f7f6f2] sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        <header className="flex items-center gap-3"><button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xl text-[#c3c8bd] transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#b7d334]/40" type="button" onClick={() => navigate('/authenticated')} aria-label="Back to home">←</button><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b7d334]">New table</p><h1 className="font-['Space_Grotesk'] text-2xl font-bold">Create Table</h1></div></header>
        <form className="mt-9 space-y-8 pb-8" onSubmit={handleSubmit} noValidate>
          <section><h2 className="font-['Space_Grotesk'] text-lg font-semibold">Table information</h2><div className="mt-4 rounded-2xl border border-white/10 bg-[#1a1d19] p-4"><label className="block text-sm font-medium text-[#d8dbd3]" htmlFor="table-name">Table name</label><input className={`mt-2 h-12 w-full rounded-xl border bg-[#111311] px-4 text-base outline-none transition placeholder:text-[#6f756c] focus:ring-2 focus:ring-[#b7d334]/20 ${nameError ? 'border-[#e27350]' : 'border-white/10 focus:border-[#b7d334]'}`} id="table-name" name="tableName" maxLength={255} placeholder="Friday Night Poker" value={tableName} onChange={(event) => { setTableName(event.target.value); setNameError(null); setErrorMessage(null); setSuccessMessage(null) }} disabled={isSubmitting} />{nameError && <p className="mt-2 text-sm text-[#ffad93]" role="alert">{nameError}</p>}</div></section>
          {errorMessage && <p className="rounded-xl border border-[#e27350]/30 bg-[#e27350]/10 px-4 py-3 text-sm text-[#ffad93]" role="alert">{errorMessage}</p>}
          {successMessage && <p className="rounded-xl border border-[#b7d334]/30 bg-[#b7d334]/10 px-4 py-3 text-sm text-[#d9ed7a]" role="status">{successMessage}</p>}
          <button className="w-full rounded-xl bg-[#b7d334] px-4 py-3.5 font-semibold text-[#151712] transition hover:bg-[#c9e34e] focus:outline-none focus:ring-2 focus:ring-[#d9ed7a] focus:ring-offset-2 focus:ring-offset-[#111311] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating Table...' : 'Create Table'}</button>
        </form>
      </div>
    </main>
  )
}