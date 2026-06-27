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

const DEFAULT_CATEGORIES = ['Personal', 'Business', 'Other']
const CATEGORIES_KEY = 'payproof_categories'
const STORAGE_KEY = 'payproof-expenses'

// ── Category persistence ──────────────────────────────────────────────────
function loadCategories(): string[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY)
    if (!raw) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES))
      return [...DEFAULT_CATEGORIES]
    }
    const data = JSON.parse(raw)
    if (!Array.isArray(data) || data.length === 0) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES))
      return [...DEFAULT_CATEGORIES]
    }
    return data as string[]
  } catch {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES))
    return [...DEFAULT_CATEGORIES]
  }
}

function persistCategories(categories: string[]) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

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
  anchorRef,
}: {
  open: boolean
  onClose: () => void
  onSelectFile: (file: File) => void
  onSelectCamera: (file: File) => void
  anchorRef: React.RefObject<HTMLDivElement | null>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  // Calculate position from anchor
  useEffect(() => {
    if (!open || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const popoverWidth = 224 // w-56
    let left = rect.right - popoverWidth
    let top = rect.bottom + 4

    // Clamp to viewport
    if (left < 8) left = 8
    if (left + popoverWidth > window.innerWidth - 8) left = window.innerWidth - popoverWidth - 8
    if (top + 120 > window.innerHeight) top = rect.top - 120 - 4

    setPosition({ top, left })
  }, [open, anchorRef])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

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

  // Focus first interactive element when opened
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      cameraRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [open])

  // Trap Tab key inside popover
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Tab') return
    const focusable = popoverRef.current?.querySelectorAll('button, input')
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      ;(last as HTMLElement).focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      ;(first as HTMLElement).focus()
    }
  }

  if (!open) return null

  return (
    <div
      ref={popoverRef}
      onKeyDown={handleKeyDown}
      className="fixed z-50 w-56 rounded-lg border border-[#3a3b40] bg-[#1a1b1f] shadow-lg shadow-black/40"
      style={{ top: position.top, left: position.left }}
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

// ── Swipeable card for mobile delete ───────────────────────────────────────
function SwipeableCard({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(0)
  const swiping = useRef(false)

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    swiping.current = true
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping.current) return
    const diff = e.touches[0].clientX - startX.current
    if (diff < 0) setOffset(Math.max(diff, -80))
  }

  function handleTouchEnd() {
    swiping.current = false
    if (offset < -60) {
      onDelete()
    }
    setOffset(0)
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Red delete background */}
      <div className="absolute inset-0 flex items-center justify-end rounded-lg bg-[#f28b82]/[0.15] pr-4">
        <span className="text-[12px] font-medium text-[#f28b82]">Delete</span>
      </div>
      {/* Foreground card */}
      <div
        className="relative transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

// ── Category Manager Modal ─────────────────────────────────────────────────
function CategoryManagerModal({
  open,
  categories,
  onClose,
  onSave,
  expenseCategoryCounts,
}: {
  open: boolean
  categories: string[]
  onClose: () => void
  onSave: (cats: string[]) => void
  expenseCategoryCounts: Record<string, number>
}) {
  const [localCats, setLocalCats] = useState<string[]>(categories)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newCat, setNewCat] = useState('')
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null)
  const editRef = useRef<HTMLInputElement>(null)

  // Sync when opened
  useEffect(() => {
    if (open) {
      setLocalCats(categories)
      setEditingIdx(null)
      setEditValue('')
      setNewCat('')
      setDeleteIdx(null)
    }
  }, [open, categories])

  // Focus edit input
  useEffect(() => {
    if (editingIdx !== null && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editingIdx])

  if (!open) return null

  function startEdit(idx: number) {
    setEditingIdx(idx)
    setEditValue(localCats[idx])
    setDeleteIdx(null)
  }

  function commitEdit() {
    if (editingIdx === null) return
    const trimmed = editValue.trim()
    if (!trimmed) { cancelEdit(); return }
    if (trimmed !== localCats[editingIdx] && localCats.includes(trimmed)) { cancelEdit(); return }
    const updated = [...localCats]
    updated[editingIdx] = trimmed
    setLocalCats(updated)
    setEditingIdx(null)
  }

  function cancelEdit() {
    setEditingIdx(null)
    setEditValue('')
  }

  function requestDelete(idx: number) {
    if (localCats[idx] === 'Other') return // can't delete Other
    setDeleteIdx(idx)
    setEditingIdx(null)
  }

  function confirmDelete() {
    if (deleteIdx === null) return
    setLocalCats((prev) => prev.filter((_, i) => i !== deleteIdx))
    setDeleteIdx(null)
  }

  function addCategory() {
    const trimmed = newCat.trim()
    if (!trimmed || localCats.includes(trimmed) || localCats.length >= 20) return
    setLocalCats((prev) => [...prev, trimmed])
    setNewCat('')
  }

  function handleSave() {
    // Ensure "Other" always exists
    const final = localCats.includes('Other') ? localCats : [...localCats, 'Other']
    onSave(final)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-[#3a3b40] bg-[#1a1b1f] shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3a3b40] px-5 py-4">
          <h3 className="text-[15px] font-semibold text-[#ffffff]">Manage Categories</h3>
          <button onClick={onClose} className="text-[#8e959f] hover:text-[#ffffff] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Category list */}
        <div className="max-h-[320px] overflow-y-auto px-5 py-3 space-y-1">
          {localCats.map((cat, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-[#2a2b30] group transition-colors">
                {editingIdx === idx ? (
                  <input
                    ref={editRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="flex-1 rounded border border-[#2e96ff] bg-[#2a2b30] px-2 py-1 text-[13px] text-[#ffffff] outline-none"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(idx)}
                    className="flex-1 text-left text-[13px] text-[#b2bbc5] hover:text-[#ffffff] transition-colors"
                  >
                    {cat}
                  </button>
                )}
                <span className="text-[11px] text-[#8e959f] tabular-nums min-w-[20px] text-right">
                  {expenseCategoryCounts[cat] ?? 0}
                </span>
                {cat !== 'Other' && (
                  <button
                    onClick={() => requestDelete(idx)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-[#8e959f] hover:text-[#f28b82] transition-all"
                    aria-label={`Delete ${cat}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 4h10M5 4V2h4v2M4 4v8h6V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Delete confirmation */}
              {deleteIdx === idx && (
                <div className="ml-2 mb-1 rounded-md border border-[#f28b82]/30 bg-[#f28b82]/[0.06] px-3 py-2">
                  <p className="text-[12px] text-[#f28b82]">
                    Delete &apos;{cat}&apos;? Expenses using it will fall back to &apos;Other&apos;.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={confirmDelete}
                      className="rounded-md bg-[#f28b82]/20 px-3 py-1 text-[11px] font-medium text-[#f28b82] hover:bg-[#f28b82]/30 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteIdx(null)}
                      className="rounded-md px-3 py-1 text-[11px] text-[#8e959f] hover:text-[#ffffff] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add category */}
        <div className="border-t border-[#3a3b40] px-5 py-3">
          <div className="flex gap-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addCategory() }}
              placeholder={localCats.length >= 20 ? 'Max 20 categories' : 'New category name'}
              disabled={localCats.length >= 20}
              className="flex-1 rounded-md border border-[#3a3b40] bg-[#2a2b30] px-3 py-2 text-[13px] text-[#ffffff] placeholder:text-[#8e959f] outline-none focus:border-[#2e96ff] disabled:opacity-50 transition-colors"
            />
            <button
              onClick={addCategory}
              disabled={!newCat.trim() || localCats.includes(newCat.trim()) || localCats.length >= 20}
              className="rounded-md bg-[#2e96ff] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2e96ff]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
          {newCat.trim() && localCats.includes(newCat.trim()) && (
            <p className="mt-1 text-[11px] text-[#f28b82]">Category already exists</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[#3a3b40] px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-[12px] text-[#8e959f] hover:text-[#ffffff] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-[#2e96ff] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2e96ff]/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pending expense from OCR ───────────────────────────────────────────────
interface PendingExpense {
  amount: number | null
  description: string
  date: string
  receiptFile: string | null
  receiptFileName: string | null
  rawOcrText: string | null
  detectedApp: string | null
}

const PENDING_KEY = 'payproof_pending_expense'

function loadPendingExpense(): PendingExpense | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    localStorage.removeItem(PENDING_KEY)
    return JSON.parse(raw) as PendingExpense
  } catch {
    localStorage.removeItem(PENDING_KEY)
    return null
  }
}

// ── Expenses Page ──────────────────────────────────────────────────────────
export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses())
  const [categories, setCategories] = useState<string[]>(() => loadCategories())
  const [formOpen, setFormOpen] = useState(false)
  const [popoverFor, setPopoverFor] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [ocrSending, setOcrSending] = useState<string | null>(null)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [filterCat, setFilterCat] = useState<string | null>(null)
  const [ocrBanner, setOcrBanner] = useState(false)

  // Undo toast state
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; expenses: Expense[] } | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Custom category dropdown
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const catDropdownRef = useRef<HTMLDivElement>(null)

  // Popover anchor refs (one per expense row)
  const popoverAnchors = useRef<Map<string, HTMLDivElement>>(new Map())
  function setPopoverAnchor(id: string, el: HTMLDivElement | null) {
    if (el) popoverAnchors.current.set(id, el)
    else popoverAnchors.current.delete(id)
  }

  // Close category dropdown on outside click
  useEffect(() => {
    if (!catDropdownOpen) return
    function handler(e: MouseEvent) {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [catDropdownOpen])

  // Form state
  const [formDate, setFormDate] = useState(() => todayStr())
  const [formDesc, setFormDesc] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState(() => loadCategories()[0])
  const [formReceipt, setFormReceipt] = useState<string | null>(null)
  const [formReceiptName, setFormReceiptName] = useState<string | null>(null)
  const [formOcrText, setFormOcrText] = useState<string | null>(null)

  // Persist on change
  useEffect(() => { saveExpenses(expenses) }, [expenses])

  // ── Load pending OCR expense on mount ───────────────────────────────────
  useEffect(() => {
    const pending = loadPendingExpense()
    if (!pending) return

    // Pre-fill form
    if (pending.date) setFormDate(pending.date)
    if (pending.description) setFormDesc(pending.description)
    if (pending.amount != null) setFormAmount(String(pending.amount))
    if (pending.receiptFile) setFormReceipt(pending.receiptFile)
    if (pending.receiptFileName) setFormReceiptName(pending.receiptFileName)
    if (pending.rawOcrText) setFormOcrText(pending.rawOcrText)

    setFormOpen(true)
    setOcrBanner(true)
  }, [])

  // ── Category management ───────────────────────────────────────────────
  const saveCategories = useCallback((newCats: string[]) => {
    // Re-assign expenses whose category was deleted
    setExpenses((prev) =>
      prev.map((e) =>
        newCats.includes(e.category) ? e : { ...e, category: 'Other' },
      ),
    )
    setCategories(newCats)
    persistCategories(newCats)
    // Fix form category if it was removed
    setFormCategory((prev) => (newCats.includes(prev) ? prev : newCats[0] ?? 'Other'))
  }, [])

  const expenseCategoryCounts = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + (e.amount || 0)
    return acc
  }, {})

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
      receiptFile: formReceipt,
      receiptFileName: formReceiptName,
      receiptOcrResult: formOcrText,
      createdAt: new Date().toISOString(),
    }

    setExpenses((prev) => [expense, ...prev])
    setFormDate(todayStr())
    setFormDesc('')
    setFormAmount('')
    setFormCategory(categories[0])
    setFormReceipt(null)
    setFormReceiptName(null)
    setFormOcrText(null)
  }, [formDate, formDesc, formAmount, formCategory, categories, formReceipt, formReceiptName, formOcrText])

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

  // ── Delete expense (with undo) ─────────────────────────────────────────
  const deleteExpense = useCallback((id: string) => {
    const expense = expenses.find((e) => e.id === id)
    if (!expense) return
    // Clear any pending undo
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    setPendingDelete({ ids: [id], expenses: [expense] })
    setShowUndo(true)
    undoTimer.current = setTimeout(() => {
      setPendingDelete(null)
      setShowUndo(false)
    }, 5000)
  }, [expenses])

  // ── Undo handler ─────────────────────────────────────────────────────
  const undoDelete = useCallback(() => {
    if (!pendingDelete) return
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setExpenses((prev) => [...prev, ...pendingDelete.expenses])
    setPendingDelete(null)
    setShowUndo(false)
  }, [pendingDelete])

  // ── Clear all (with undo) ────────────────────────────────────────────
  const clearAll = useCallback(() => {
    if (expenses.length === 0) return
    // Clear any pending undo
    if (undoTimer.current) clearTimeout(undoTimer.current)
    const allExpenses = [...expenses]
    setExpenses([])
    setPendingDelete({ ids: allExpenses.map((e) => e.id), expenses: allExpenses })
    setShowUndo(true)
    undoTimer.current = setTimeout(() => {
      setPendingDelete(null)
      setShowUndo(false)
    }, 5000)
  }, [expenses])

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

  const filtered = filterCat ? expenses.filter((e) => e.category === filterCat) : expenses
  const sorted = [...filtered].sort((a, b) => {
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

      {/* OCR scan notification banner */}
      {ocrBanner && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-[#81c995]/30 bg-[#81c995]/[0.08] px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
            <circle cx="9" cy="9" r="8" stroke="#81c995" strokeWidth="1.5" />
            <path d="M6 9l2 2 4-4" stroke="#81c995" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="flex-1 text-[12px] font-medium text-[#81c995] sm:text-[13px]">
            New data from OCR scan — adjust and save
          </p>
          <button
            onClick={() => setOcrBanner(false)}
            className="shrink-0 p-1 text-[#81c995]/60 hover:text-[#81c995] transition-colors"
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

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

      {/* By Category stats */}
      {totalCount > 0 && categories.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-medium text-[#8e959f] uppercase tracking-wider">By Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const count = expenseCategoryCounts[cat] ?? 0
              const total = categoryTotals[cat] ?? 0
              return (
                <div
                  key={cat}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#3a3b40] bg-[#1a1b1f] px-3 py-2"
                >
                  <span className="text-[12px] text-[#b2bbc5]">{cat}</span>
                  <span className="text-[12px] font-semibold text-[#ffffff] tabular-nums">{count}</span>
                  <span className="text-[11px] text-[#8e959f]">·</span>
                  <span className="text-[12px] font-medium text-[#ffffff] tabular-nums">
                    {total.toLocaleString('en-US')} Ks
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Category filter pills */}
      {expenses.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterCat(null)}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
              filterCat === null
                ? 'bg-[#2e96ff] text-white'
                : 'border border-[#3a3b40] bg-[#1a1b1f] text-[#8e959f] hover:text-[#ffffff] hover:border-[#8e959f]',
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? null : cat)}
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
                filterCat === cat
                  ? 'bg-[#2e96ff] text-white'
                  : 'border border-[#3a3b40] bg-[#1a1b1f] text-[#8e959f] hover:text-[#ffffff] hover:border-[#8e959f]',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Add expense form */}
      {formOpen && (
        <div className="mb-6 rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-4 sm:p-5 animate-[slideDown_0.2s_ease-out]">
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

          {/* Receipt preview (from OCR) */}
          {formReceipt && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-[#2a2b30] px-3 py-2">
              <img
                src={formReceipt}
                alt="Receipt preview"
                className="h-8 w-8 rounded object-cover"
              />
              <span className="flex-1 text-[11px] text-[#b2bbc5] truncate">
                {formReceiptName ?? 'Receipt from OCR'}
              </span>
              <button
                onClick={() => { setFormReceipt(null); setFormReceiptName(null); setFormOcrText(null) }}
                className="shrink-0 text-[#8e959f] hover:text-[#f28b82] transition-colors"
                aria-label="Remove receipt"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          {/* Category + submit row */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:w-48">
              <label className="mb-1.5 block text-[11px] font-medium text-[#8e959f] sm:text-[12px]">
                Category
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1" ref={catDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCatDropdownOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-md border border-[#3a3b40] bg-[#2a2b30] px-3 py-2 text-[13px] text-[#ffffff] outline-none focus:border-[#2e96ff] transition-colors"
                  >
                    {formCategory}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#8e959f]">
                      <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {catDropdownOpen && (
                    <div className="absolute bottom-full mb-1 left-0 z-20 w-full rounded-lg border border-[#3a3b40] bg-[#1a1b1f] shadow-lg shadow-black/40 py-1">
                      {categories.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setFormCategory(c); setCatDropdownOpen(false) }}
                          className={`w-full px-3 py-2 text-left text-[13px] transition-colors ${
                            formCategory === c
                              ? 'bg-[#2e96ff]/[0.1] text-[#2e96ff]'
                              : 'text-[#b2bbc5] hover:bg-[#2a2b30] hover:text-[#ffffff]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCatModalOpen(true)}
                  className="shrink-0 rounded-md border border-[#3a3b40] bg-[#2a2b30] px-2.5 py-2 text-[#8e959f] hover:text-[#2e96ff] hover:border-[#2e96ff] transition-colors"
                  aria-label="Manage categories"
                  title="Manage categories"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>
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
                    <div className="relative" ref={(el) => setPopoverAnchor(expense.id, el)}>
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
                        anchorRef={{ current: popoverAnchors.current.get(expense.id) ?? null }}
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
              <SwipeableCard key={expense.id} onDelete={() => deleteExpense(expense.id)}>
              <div
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

                  <div className="relative" ref={(el) => setPopoverAnchor(expense.id, el)}>
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
                      anchorRef={{ current: popoverAnchors.current.get(expense.id) ?? null }}
                    />
                  </div>
                </div>
              </div>
              </SwipeableCard>
            ))}
          </div>
        </>
      )}

      {/* Undo toast */}
      {showUndo && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-[#3a3b40] bg-[#1a1b1f] px-4 py-3 shadow-lg shadow-black/40">
          <span className="text-[13px] text-[#b2bbc5]">
            {pendingDelete?.ids.length === 1 ? 'Expense deleted' : `${pendingDelete?.ids.length} expenses deleted`}
          </span>
          <button
            onClick={undoDelete}
            className="rounded-md bg-[#2e96ff] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#2e96ff]/90 transition-colors"
          >
            Undo
          </button>
        </div>
      )}

      {/* Category manager modal */}
      <CategoryManagerModal
        open={catModalOpen}
        categories={categories}
        onClose={() => setCatModalOpen(false)}
        onSave={saveCategories}
        expenseCategoryCounts={expenseCategoryCounts}
      />
    </div>
  )
}
