import { useState, useEffect, useRef, useCallback } from 'react'

// ── Design tokens (Google AI Studio dark) ───────────────────────────────────
// bg-page:       #121317
// bg-card:       #1a1b1f
// bg-elevated:   #2a2b30
// border:        #3a3b40
// primary:       #2e96ff
// text-primary:  #ffffff
// text-secondary:#b2bbc5
// text-muted:    #8e959f
// green:         #81c995
// amber:         #fdd663
// red:           #f28b82

// ── Types ──────────────────────────────────────────────────────────────────
interface Expense {
  id: string
  date: string
  description: string
  amount: number
  category: string
  receiptFile: string | null     // base64 data URL or null
  receiptFileName: string | null
  receiptOcrResult: string | null  // OCR extracted text
  createdAt: string
}

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Shopping', 'Healthcare', 'Other']

const STORAGE_KEY = 'payproof-expenses'

// ── Helpers ────────────────────────────────────────────────────────────────
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatAmount(amount: number) {
  if (isNaN(amount)) return '—'
  return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// ── Load / save ────────────────────────────────────────────────────────────
function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

function saveExpenses(expenses: Expense[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
}

// ── Receipt thumbnail ──────────────────────────────────────────────────────
function ReceiptThumbnail({
  file,
  fileName,
  onRemove,
}: {
  file: string
  fileName: string | null
  onRemove: () => void
}) {
  return (
    <div className="relative group inline-flex items-center gap-2 rounded-md bg-[#2a2b30] pr-2">
      <img
        src={file}
        alt="Receipt thumbnail"
        className="h-8 w-8 rounded-l-md object-cover"
      />
      <span className="text-[11px] text-[#b2bbc5] truncate max-w-[100px] sm:max-w-[160px]">
        {fileName ?? 'Receipt'}
      </span>
      <button
        onClick={onRemove}
        className="shrink-0 text-[#8e959f] hover:text-[#f28b82] transition-colors"
        aria-label="Remove receipt"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ── Receipt popover ────────────────────────────────────────────────────────
function ReceiptPopover({
  open,
  onClose,
  onSelectFile,
  onSelectCamera,
}: {
  open: boolean
  onClose: () => void
  onSelectFile: (file: File) => void
  onSelectCamera: (file: File) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-[#3a3b40] bg-[#1a1b1f] shadow-lg shadow-black/40"
    >
      <div className="px-1 py-1">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] text-[#b2bbc5] hover:bg-[#2a2b30] hover:text-[#ffffff] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3 5h12a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Upload from file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) { onSelectFile(f); onClose() }
            e.target.value = ''
          }}
        />
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] text-[#b2bbc5] hover:bg-[#2a2b30] hover:text-[#ffffff] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 4l1 2h2a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1h2l1-2h6z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Capture from camera
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) { onSelectCamera(f); onClose() }
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

// ── Expenses Page ──────────────────────────────────────────────────────────
export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses())
  const [formOpen, setFormOpen] = useState(false)
  const [popoverFor, setPopoverFor] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [ocrSending, setOcrSending] = useState<string | null>(null)

  // Form state
  const [formDate, setFormDate] = useState(() => todayStr())
  const [formDesc, setFormDesc] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState(CATEGORIES[0])

  // Persist on change
  useEffect(() => { saveExpenses(expenses) }, [expenses])

  // ── Add expense ────────────────────────────────────────────────────────
  const addExpense = useCallback(() => {
    if (!formDesc.trim() || !formAmount.trim()) return
    const amountNum = parseFloat(formAmount)
    if (isNaN(amountNum) || amountNum < 0) return

    const expense: Expense = {
      id: genId(),
      date: formDate,
      description: formDesc.trim(),
      amount: amountNum,
      category: formCategory,
      receiptFile: null,
      receiptFileName: null,
      receiptOcrResult: null,
      createdAt: new Date().toISOString(),
    }

    setExpenses((prev) => [expense, ...prev])
    setFormDate(todayStr())
    setFormDesc('')
    setFormAmount('')
    setFormCategory(CATEGORIES[0])
  }, [formDate, formDesc, formAmount, formCategory])

  // ── Attach receipt ─────────────────────────────────────────────────────
  const attachReceipt = useCallback(async (id: string, file: File) => {
    const dataUrl = await readFileAsDataURL(file)
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, receiptFile: dataUrl, receiptFileName: file.name, receiptOcrResult: null }
          : e,
      ),
    )
  }, [])

  // ── Send receipt to OCR ────────────────────────────────────────────────
  const sendToOcr = useCallback(async (id: string) => {
    const expense = expenses.find((e) => e.id === id)
    if (!expense?.receiptFile) return

    setOcrSending(id)
    try {
      // Convert data URL to blob
      const res = await fetch(expense.receiptFile)
      const blob = await res.blob()
      const form = new FormData()
      form.append('file', blob, expense.receiptFileName ?? 'receipt.png')

      const ocrRes = await fetch('/api/v1/ocr', { method: 'POST', body: form })
      const json = await ocrRes.json()

      if (json.success) {
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, receiptOcrResult: json.data?.raw_text ?? null } : e,
          ),
        )
      }
    } catch {
      // Silently fail — OCR is best-effort for receipts
    } finally {
      setOcrSending(null)
    }
  }, [expenses])

  // ── Remove receipt ─────────────────────────────────────────────────────
  const removeReceipt = useCallback((id: string) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, receiptFile: null, receiptFileName: null, receiptOcrResult: null }
          : e,
      ),
    )
  }, [])

  // ── Delete expense ─────────────────────────────────────────────────────
  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // ── Clear all ──────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    if (confirm('Delete all expenses? This cannot be undone.')) {
      setExpenses([])
    }
  }, [])

  // ── Sort ───────────────────────────────────────────────────────────────
  const toggleSort = useCallback((key: 'date' | 'amount') => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('desc')
      return key
    })
  }, [])

  const sorted = [...expenses].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'date') return a.date.localeCompare(b.date) * dir
    return (a.amount - b.amount) * dir
  })

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalCount = expenses.length
  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header + action row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[20px] font-medium text-[#ffffff] sm:text-[24px]">Expenses</h2>
          <p className="mt-1 text-[13px] text-[#b2bbc5] sm:text-[14px]">
            Track and manage your expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <button
              onClick={clearAll}
              className="rounded-md px-3 py-2 text-[11px] font-medium text-[#8e959f] hover:bg-[#f28b82]/[0.1] hover:text-[#f28b82] transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setFormOpen((v) => !v)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors',
              formOpen
                ? 'bg-[#2a2b30] text-[#b2bbc5]'
                : 'bg-[#2e96ff] text-white hover:bg-[#2e96ff]/90',
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d={formOpen ? 'M4 8h8' : 'M8 4v8M4 8h8'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {formOpen ? 'Cancel' : 'Add Expense'}
          </button>
        </div>
      </div>

      {/* Stats pills */}
      {totalCount > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3a3b40] bg-[#1a1b1f] px-3 py-1.5">
            <span className="text-[11px] text-[#8e959f] sm:text-[12px]">Total</span>
            <span className="text-[13px] font-semibold text-[#ffffff] tabular-nums">{totalCount}</span>
            <span className="text-[11px] text-[#8e959f]">
              {totalCount === 1 ? 'expense' : 'expenses'}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3a3b40] bg-[#1a1b1f] px-3 py-1.5">
            <span className="text-[11px] text-[#8e959f] sm:text-[12px]">Amount</span>
            <span className="text-[13px] font-semibold text-[#ffffff] tabular-nums">
              {totalAmount.toLocaleString('en-US')} Ks
            </span>
          </div>
        </div>
      )}

      {/* Add expense form */}
      {formOpen && (
        <div className="mb-6 rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Date */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[#8e959f] sm:text-[12px]">
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full rounded-md border border-[#3a3b40] bg-[#2a2b30] px-3 py-2 text-[13px] text-[#ffffff] outline-none focus:border-[#2e96ff] transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[11px] font-medium text-[#8e959f] sm:text-[12px]">
                Description
              </label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="What did you spend on?"
                className="w-full rounded-md border border-[#3a3b40] bg-[#2a2b30] px-3 py-2 text-[13px] text-[#ffffff] placeholder:text-[#8e959f] outline-none focus:border-[#2e96ff] transition-colors"
                onKeyDown={(e) => { if (e.key === 'Enter') addExpense() }}
              />
            </div>

            {/* Amount */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1.5 block text-[11px] font-medium text-[#8e959f] sm:text-[12px]">
                  Amount (Ks)
                </label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="100"
                  className="w-full rounded-md border border-[#3a3b40] bg-[#2a2b30] px-3 py-2 text-[13px] font-medium text-[#ffffff] tabular-nums placeholder:text-[#8e959f] outline-none focus:border-[#2e96ff] transition-colors"
                  onKeyDown={(e) => { if (e.key === 'Enter') addExpense() }}
                />
              </div>
            </div>
          </div>

          {/* Category + submit row */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:w-48">
              <label className="mb-1.5 block text-[11px] font-medium text-[#8e959f] sm:text-[12px]">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full rounded-md border border-[#3a3b40] bg-[#2a2b30] px-3 py-2 text-[13px] text-[#ffffff] outline-none focus:border-[#2e96ff] transition-colors"
                style={{ colorScheme: 'dark' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={addExpense}
              disabled={!formDesc.trim() || !formAmount.trim()}
              className="rounded-lg bg-[#2e96ff] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#2e96ff]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add Expense
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="rounded-lg border border-dashed border-[#3a3b40] bg-[#1a1b1f] py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2e96ff]/[0.12]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="#2e96ff" strokeWidth="1.5" />
              <path d="M3 9h18" stroke="#2e96ff" strokeWidth="1.5" />
              <path d="M9 4v5" stroke="#2e96ff" strokeWidth="1.5" />
            </svg>
          </div>
          <p className="text-[13px] text-[#8e959f] sm:text-[14px]">
            No expenses yet. Add your first expense to get started.
          </p>
        </div>
      )}

      {/* Expenses list */}
      {expenses.length > 0 && (
        <>
          {/* Desktop table header */}
          <div className="hidden sm:block">
            <div className="rounded-lg border border-[#3a3b40] bg-[#1a1b1f] overflow-hidden">
              <div className="flex items-center border-b border-[#3a3b40] px-5 py-3">
                <button
                  onClick={() => toggleSort('date')}
                  className="flex w-[120px] items-center gap-1.5 text-[11px] font-medium text-[#8e959f] hover:text-[#ffffff] transition-colors"
                >
                  Date
                  {sortKey === 'date' && (
                    <span className="text-[#2e96ff]">{sortDir === 'desc' ? '↓' : '↑'}</span>
                  )}
                </button>
                <span className="flex-1 text-[11px] font-medium text-[#8e959f]">Description</span>
                <span className="w-[100px] hidden md:block text-[11px] font-medium text-[#8e959f]">Category</span>
                <button
                  onClick={() => toggleSort('amount')}
                  className="flex w-[100px] items-center justify-end gap-1.5 text-[11px] font-medium text-[#8e959f] hover:text-[#ffffff] transition-colors"
                >
                  Amount
                  {sortKey === 'amount' && (
                    <span className="text-[#2e96ff]">{sortDir === 'desc' ? '↓' : '↑'}</span>
                  )}
                </button>
                <span className="w-[140px] text-right text-[11px] font-medium text-[#8e959f]">Receipt</span>
                <span className="w-[32px]" />
              </div>

              {/* Rows */}
              {sorted.map((expense, i) => (
                <div
                  key={expense.id}
                  className={cn(
                    'flex items-center px-5 py-3 transition-colors hover:bg-[#2a2b30]/50',
                    i % 2 === 1 && 'bg-[#121317]',
                  )}
                >
                  <span className="w-[120px] text-[12px] tabular-nums text-[#b2bbc5]">
                    {formatDate(expense.date)}
                  </span>
                  <span className="flex-1 text-[13px] font-medium text-[#ffffff] truncate pr-2">
                    {expense.description}
                  </span>
                  <span className="w-[100px] hidden md:block text-[11px] text-[#8e959f]">
                    {expense.category}
                  </span>
                  <span className="w-[100px] text-right text-[13px] font-medium tabular-nums text-[#ffffff]">
                    {formatAmount(expense.amount)} Ks
                  </span>

                  {/* Receipt column */}
                  <span className="w-[140px] flex justify-end">
                    <div className="relative">
                      {/* Receipt attached — show thumbnail + actions */}
                      {expense.receiptFile ? (
                        <div className="flex items-center gap-1.5">
                          <ReceiptThumbnail
                            file={expense.receiptFile}
                            fileName={expense.receiptFileName}
                            onRemove={() => removeReceipt(expense.id)}
                          />
                          {!expense.receiptOcrResult && (
                            <button
                              onClick={() => sendToOcr(expense.id)}
                              disabled={ocrSending === expense.id}
                              className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-[#8e959f] border border-[#3a3b40] hover:text-[#2e96ff] hover:border-[#2e96ff] disabled:opacity-50 transition-colors"
                            >
                              {ocrSending === expense.id ? '…' : 'Scan'}
                            </button>
                          )}
                          {expense.receiptOcrResult && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-[#81c995]"
                              title={expense.receiptOcrResult}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#81c995]" />
                              OCR'd
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPopoverFor(popoverFor === expense.id ? null : expense.id)
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-[#3a3b40] px-2.5 py-1.5 text-[11px] text-[#8e959f] hover:border-[#2e96ff] hover:text-[#2e96ff] transition-colors"
                        >
                          📎 Attach
                        </button>
                      )}

                      <ReceiptPopover
                        open={popoverFor === expense.id}
                        onClose={() => setPopoverFor(null)}
                        onSelectFile={(f) => attachReceipt(expense.id, f)}
                        onSelectCamera={(f) => attachReceipt(expense.id, f)}
                      />
                    </div>
                  </span>

                  {/* Delete */}
                  <span className="w-[32px] flex justify-end">
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="text-[#8e959f] hover:text-[#f28b82] transition-colors"
                      aria-label="Delete expense"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 4h10M5 4V2h4v2M4 4v8h6V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-3">
            {sorted.map((expense) => (
              <div
                key={expense.id}
                className="rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#ffffff] truncate">
                      {expense.description}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8e959f]">{expense.category}</p>
                  </div>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="shrink-0 ml-2 p-1 text-[#8e959f] hover:text-[#f28b82] transition-colors"
                    aria-label="Delete expense"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 4h10M5 4V2h4v2M4 4v8h6V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] tabular-nums text-[#b2bbc5]">
                      {formatDate(expense.date)}
                    </span>
                    <span className="text-[14px] font-semibold tabular-nums text-[#ffffff]">
                      {formatAmount(expense.amount)} Ks
                    </span>
                    {/* Receipt status indicator */}
                    <span className={cn(
                      "text-[11px]",
                      expense.receiptFile ? "text-[#81c995]" : "text-[#8e959f]"
                    )}>
                      {expense.receiptFile ? "📎 Attached" : "— None"}
                    </span>
                  </div>

                  <div className="relative">
                    {expense.receiptFile ? (
                      <div className="flex items-center gap-2">
                        <ReceiptThumbnail
                          file={expense.receiptFile}
                          fileName={expense.receiptFileName}
                          onRemove={() => removeReceipt(expense.id)}
                        />
                        {!expense.receiptOcrResult && (
                          <button
                            onClick={() => sendToOcr(expense.id)}
                            disabled={ocrSending === expense.id}
                            className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-[#8e959f] border border-[#3a3b40] hover:text-[#2e96ff] hover:border-[#2e96ff] disabled:opacity-50 transition-colors"
                          >
                            {ocrSending === expense.id ? '…' : 'Scan'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setPopoverFor(popoverFor === expense.id ? null : expense.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#3a3b40] px-2.5 py-1.5 text-[11px] text-[#8e959f] hover:border-[#2e96ff] hover:text-[#2e96ff] transition-colors"
                      >
                        📎 Attach
                      </button>
                    )}

                    <ReceiptPopover
                      open={popoverFor === expense.id}
                      onClose={() => setPopoverFor(null)}
                      onSelectFile={(f) => attachReceipt(expense.id, f)}
                      onSelectCamera={(f) => attachReceipt(expense.id, f)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
