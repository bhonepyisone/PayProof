import { useCallback, useState, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { recordScan } from '../hooks/useGameState'
import { cn, todayStr, readFileAsDataURL } from '../lib/utils'
import { confirmScan, getScanHistory, deleteScan, clearAllScans } from '../lib/api'
import StreakBadge from '../components/StreakBadge'
import DailyGoal from '../components/DailyGoal'

// ── Types ──────────────────────────────────────────────────────────────────
interface OcrResult {
  id: number
  amount: string | null
  ref_no: string | null
  sender: string | null
  date: string | null
  confidence: number
  review_status: 'auto-accepted' | 'manual-review' | 'rejected'
  raw_text: string | null
  template: string
  detected_app: string | null
  llm_confidence: number | null
  confirmed: boolean
  confirmed_at: string | null
}

interface HistoryItem {
  id: number
  amount: string | null
  ref_no: string | null
  sender: string | null
  date: string | null
  confidence: number | null
  review_status: string | null
  template: string | null
  detected_app: string | null
  confirmed: boolean
  confirmed_at: string | null
  created_at: string | null
  raw_text: string | null
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="20" r="3" fill="currentColor" />
      <path d="M6 32l10-10 8 8 6-6 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DismissIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 5v4M9 12v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ── ConfidenceBadge ────────────────────────────────────────────────────────
function ConfidenceBadge({
  status,
  confidence,
}: {
  status: OcrResult['review_status']
  confidence: number
}) {
  const config = {
    'auto-accepted': { dot: 'bg-[var(--color-green)]', text: 'text-[var(--color-green)]', label: 'Auto-accepted' },
    'manual-review': { dot: 'bg-[var(--color-amber)]', text: 'text-[var(--color-amber)]', label: 'Manual review' },
    rejected:         { dot: 'bg-[var(--color-red)]', text: 'text-[var(--color-red)]', label: 'Rejected' },
  }[status]

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 py-1 sm:gap-2 sm:px-3">
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      <span className={cn('text-[11px] font-medium sm:text-xs', config.text)}>{config.label}</span>
      <span className="text-[10px] font-medium text-[var(--color-text-muted)] tabular-nums sm:text-[11px]">
        {confidence.toFixed(0)}%
      </span>
    </div>
  )
}

// ── FieldRow ───────────────────────────────────────────────────────────────
function FieldRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
      <span className="text-[12px] font-medium text-[var(--color-text-muted)] sm:text-[13px]">{label}</span>
      <span className="text-[14px] font-medium text-[var(--color-text-primary)] tabular-nums sm:text-[14px]">
        {value ?? <span className="text-[var(--color-red)]">—</span>}
      </span>
    </div>
  )
}

// ── UploadZone ─────────────────────────────────────────────────────────────
function UploadZone({
  onResult,
  onError,
  onFileRef,
}: {
  onResult: (r: OcrResult) => void
  onError: (msg: string) => void
  onFileRef: React.MutableRefObject<File | null>
}) {
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return

      // Store file reference for later use (Add to Expenses)
      onFileRef.current = file

      setLoading(true)
      onError('')
      try {
        const { ocrUpload } = await import('../lib/api')
        const json = await ocrUpload(file)
        if (json.success) {
          onResult(json.data as OcrResult)
        } else {
          onError(json.detail ?? 'Unknown error from server')
        }
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to reach OCR server')
      } finally {
        setLoading(false)
      }
    },
    [onResult, onError, onFileRef],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'cursor-pointer rounded-lg border border-dashed p-6 text-center transition-colors duration-200 sm:p-12 lg:p-16',
        isDragActive
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/[0.06]'
          : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-text-muted)]',
      )}
    >
      <input {...getInputProps()} aria-label="Upload KBZ Pay screenshot for OCR" />

      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-primary)]" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-primary)] [animation-delay:150ms]" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-primary)] [animation-delay:300ms]" />
          </div>
          <p className="text-[14px] font-medium text-[var(--color-text-secondary)] sm:text-[15px]">Processing OCR…</p>
        </div>
      ) : isDragActive ? (
        <div className="flex flex-col items-center gap-3">
          <UploadIcon className="text-[var(--color-primary)]" />
          <p className="text-[14px] font-medium text-[var(--color-primary)] sm:text-[15px]">Drop your screenshot</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <UploadIcon className="text-[var(--color-text-muted)]" />
          <div>
            <p className="text-[14px] font-medium text-[var(--color-text-secondary)] sm:text-[15px]">
              Drag & drop a KBZ Pay screenshot
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-text-muted)] sm:text-[13px]">
              PNG, JPG, or WebP — one image at a time
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PendingExpense type ─────────────────────────────────────────────────────
interface PendingExpense {
  amount: number | null
  description: string
  date: string
  receiptFile: string | null
  receiptFileName: string | null
  rawOcrText: string | null
  detectedApp: string | null
}

// ── Toast notification ─────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-[slideIn_0.3s_ease-out] rounded-lg border border-[var(--color-green)]/30 bg-[var(--color-green)]/[0.15] px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <CheckCircleIcon className="h-4 w-4 text-[var(--color-green)]" />
        <span className="text-[13px] font-medium text-[var(--color-green)]">{message}</span>
      </div>
    </div>
  )
}

// ── ResultCard ─────────────────────────────────────────────────────────────
function ResultCard({
  result,
  onConfirm,
  onAddToExpenses,
}: {
  result: OcrResult
  onConfirm: () => void
  onAddToExpenses: () => void
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <h2 className="text-[14px] font-medium text-[var(--color-text-primary)] sm:text-[15px]">OCR Result</h2>
        <div className="flex flex-wrap items-center gap-2">
          {result.confirmed && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-green)]/40 bg-[var(--color-green)]/[0.12] px-2.5 py-1 text-[11px] font-medium text-[var(--color-green)] sm:text-xs">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Confirmed
            </span>
          )}
          <ConfidenceBadge status={result.review_status} confidence={result.confidence} />
        </div>
      </div>

      {/* Fields */}
      <div className="divide-y divide-[var(--color-border)]">
        <FieldRow label="Amount" value={result.amount} />
        <FieldRow label="Ref No" value={result.ref_no} />
        <FieldRow label="Sender" value={result.sender} />
        <FieldRow label="Date" value={result.date} />
      </div>

      {/* Confidence bar */}
      <div className="border-t border-[var(--color-border)] px-4 py-3 sm:px-5 sm:py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[var(--color-text-muted)] sm:text-[12px]">Confidence</span>
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)] tabular-nums sm:text-[12px]">
            {result.confidence.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(result.confidence, 100)}%`,
              backgroundColor:
                result.confidence >= 95 ? 'var(--color-green)' : result.confidence >= 70 ? 'var(--color-amber)' : 'var(--color-red)',
            }}
          />
        </div>
      </div>

      {/* Raw OCR text */}
      {result.raw_text && (
        <details className="group border-t border-[var(--color-border)]">
          <summary className="cursor-pointer px-4 py-3 text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] select-none sm:px-5 sm:text-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] rounded">
            Raw OCR text
          </summary>
          <pre className="max-h-48 overflow-auto border-t border-[var(--color-border)] bg-[var(--color-bg-page)] px-4 py-3 text-[11px] font-mono leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-wrap sm:px-5 sm:py-4 sm:text-[12px]">
            {result.raw_text}
          </pre>
        </details>
      )}

      {/* Manual confirm button */}
      <div className="border-t border-[var(--color-border)] px-4 py-3 sm:px-5 sm:py-4">
        {result.confirmed ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-[var(--color-green)]/30 bg-[var(--color-green)]/[0.08] px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-green)]" />
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-green)]" />
            </svg>
            <span className="text-[13px] font-medium text-[var(--color-green)]">
              Payment confirmed
              {result.confirmed_at && (
                <span className="ml-1.5 font-normal text-[var(--color-text-muted)]">
                  · {new Date(result.confirmed_at).toLocaleString()}
                </span>
              )}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={onConfirm}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-green)] px-4 py-2.5 text-[13px] font-medium text-white hover:opacity-90 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[var(--color-green)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Confirm Payment Received
            </button>
            <button
              onClick={onAddToExpenses}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)]"
            >
              <PlusIcon />
              Add to Expenses
              <ChevronIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ErrorBanner ────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  if (!message) return null
  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--color-red)]/30 bg-[var(--color-red)]/[0.08] px-3 py-3 sm:px-4">
      <AlertIcon className="mt-0.5 shrink-0 text-[var(--color-red)]" />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[var(--color-red)] sm:text-[13px]">OCR server error</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--color-text-secondary)] sm:text-[12px]">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss error"
      >
        <DismissIcon />
      </button>
    </div>
  )
}

// ── Recent Payments Dashboard ────────────────────────────────────────────────
function RecentPayments({
  items,
  onRowClick,
  onDelete,
  onClearAll,
  clearing,
}: {
  items: HistoryItem[]
  onRowClick: (item: HistoryItem) => void
  onDelete: (id: number) => void
  onClearAll: () => void
  clearing: boolean
}) {
  if (items.length === 0) {
    return (
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)] sm:text-[15px]">Recent Payments</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-10 text-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-3 text-[var(--color-text-muted)]">
            <rect x="5" y="8" width="30" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="14" cy="17" r="3" fill="currentColor" />
            <path d="M5 28l9-9 6 6 5-5 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <p className="text-[13px] font-medium text-[var(--color-text-secondary)] sm:text-[14px]">
            No scans yet
          </p>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)] sm:text-[12px]">
            Drag a screenshot above to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)] sm:text-[15px]">
          Recent Payments
          <span className="ml-1.5 text-[11px] font-normal text-[var(--color-text-muted)]">({items.length})</span>
        </h2>
        <button
          onClick={onClearAll}
          disabled={clearing}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-red)] transition-colors disabled:opacity-50 sm:text-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--color-red)]/40 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-page)] rounded min-h-[36px] px-2"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 3h9M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M2.5 3l.7 7.2a1 1 0 001 .8h3.6a1 1 0 001-.8L9.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Clear All
        </button>
      </div>

      {/* Table header — hidden on mobile, visible sm+ */}
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
        <div className="w-[100px] shrink-0">Date</div>
        <div className="w-[90px] shrink-0 text-right">Amount</div>
        <div className="flex-1 min-w-0">Sender</div>
        <div className="w-[80px] shrink-0 text-center">Confidence</div>
        <div className="w-[80px] shrink-0 text-center">Status</div>
        <div className="w-10 shrink-0" />
      </div>

      {/* Table rows */}
      <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        {items.map((item) => {
          const conf = item.confidence ?? 0
          const confColor =
            conf >= 95 ? 'text-[var(--color-green)]' : conf >= 70 ? 'text-[var(--color-amber)]' : 'text-[var(--color-red)]'

          return (
            <button
              key={item.id}
              onClick={() => onRowClick(item)}
              className="w-full text-left px-4 py-3 sm:px-5 sm:py-3 hover:bg-[var(--color-bg-elevated)]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)]/30"
            >
              {/* Mobile layout: stacked */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                    {item.amount ? `${Number(item.amount).toLocaleString()} Ks` : '—'}
                  </span>
                  {item.confirmed ? (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[var(--color-green)]">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/[0.1] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-amber)]">
                      Pending
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date || ''}
                  </span>
                  {item.sender && (
                    <span className="text-[11px] text-[var(--color-text-secondary)] truncate max-w-[120px]">{item.sender}</span>
                  )}
                  <span className={cn('text-[11px] font-medium tabular-nums', confColor)}>
                    {conf.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Desktop layout: row */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-[100px] shrink-0 text-[13px] text-[var(--color-text-secondary)]">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date || '—'}
                </div>
                <div className="w-[90px] shrink-0 text-right text-[14px] font-medium text-[var(--color-text-primary)] tabular-nums">
                  {item.amount ? `${Number(item.amount).toLocaleString()} Ks` : '—'}
                </div>
                <div className="flex-1 min-w-0 text-[13px] text-[var(--color-text-secondary)] truncate">
                  {item.sender || '—'}
                </div>
                <div className={cn('w-[80px] shrink-0 text-center text-[13px] font-medium tabular-nums', confColor)}>
                  {conf.toFixed(0)}%
                </div>
                <div className="w-[80px] shrink-0 text-center">
                  {item.confirmed ? (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[var(--color-green)]">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M4 6l1.5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/[0.1] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-amber)]">
                      Pending
                    </span>
                  )}
                </div>
                <div className="w-10 shrink-0 flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(item.id)
                    }}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-red)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-red)]/40 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label={`Delete scan ${item.id}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M3.5 3.5l.6 7.8a1 1 0 001 .95h3.8a1 1 0 001-.95l.6-7.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Undo Toast ──────────────────────────────────────────────────────────────
function UndoToast({
  message,
  visible,
  onUndo,
  onDismiss,
}: {
  message: string
  visible: boolean
  onUndo: () => void
  onDismiss: () => void
}) {
  if (!visible) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-[slideIn_0.3s_ease-out] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{message}</span>
        <button
          onClick={onUndo}
          className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-elevated)] min-h-[36px]"
        >
          Undo
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── OcrScanner Page ────────────────────────────────────────────────────────
export default function OcrScanner() {
  const [result, setResult] = useState<OcrResult | null>(null)
  const [error, setError] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [confirmHistory, setConfirmHistory] = useState<HistoryItem[]>([])
  const [undoPending, setUndoPending] = useState(false)
  const [undoVisible, setUndoVisible] = useState(false)
  const uploadedFileRef = useRef<File | null>(null)
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load history ─────────────────────────────────────────────────
  const refreshHistory = useCallback(() => {
    getScanHistory()
      .then((json) => {
        if (json.success) setConfirmHistory(json.data as HistoryItem[])
      })
      .catch(() => {})
  }, [])

  // Load history on mount
  useEffect(() => {
    refreshHistory()
  }, [refreshHistory])

  const handleResult = useCallback((r: OcrResult) => {
    setResult(null)
    requestAnimationFrame(() => {
      setResult(r)
      // Record scan for gamification
      recordScan(r.detected_app ?? 'Unknown')
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!result || result.confirmed) return
    try {
      const json = await confirmScan(result.id)
      if (json.success) {
        setResult((prev) =>
          prev ? { ...prev, confirmed: true, confirmed_at: json.data.confirmed_at } : prev,
        )
        // Refresh history
        refreshHistory()
        setToastMessage('Payment confirmed!')
        setToastVisible(true)
        setTimeout(() => setToastVisible(false), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm payment')
    }
  }, [result, refreshHistory])

  // ── Click a history row → re-show in ResultCard ───────────────────
  const handleRowClick = useCallback((item: HistoryItem) => {
    const reconstructed: OcrResult = {
      id: item.id,
      amount: item.amount,
      ref_no: item.ref_no,
      sender: item.sender,
      date: item.date,
      confidence: item.confidence ?? 0,
      review_status: (item.review_status as OcrResult['review_status']) ?? 'manual-review',
      raw_text: item.raw_text,
      template: item.template ?? 'kbz_pay',
      detected_app: item.detected_app,
      llm_confidence: null,
      confirmed: item.confirmed,
      confirmed_at: item.confirmed_at,
    }
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setResult(reconstructed)
    // Record scan for gamification (only if not already recorded)
    recordScan(item.detected_app ?? 'Unknown')
  }, [])

  // ── Delete a single scan ──────────────────────────────────────────
  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteScan(id)
      setToastMessage('Scan deleted')
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 3000)
      refreshHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scan')
    }
  }, [refreshHistory])

  // ── Clear All with undo ───────────────────────────────────────────
  const handleClearAll = useCallback(() => {
    if (undoPending) return

    // Immediately hide the items visually
    setConfirmHistory([])
    setUndoVisible(true)
    setUndoPending(true)

    // After 5 seconds, actually delete
    clearTimeoutRef.current = setTimeout(async () => {
      try {
        await clearAllScans()
      } catch {
        // If clear fails, reload history to restore
        refreshHistory()
      }
      setUndoPending(false)
      setUndoVisible(false)
      setToastMessage('All scans cleared')
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 3000)
    }, 5000)
  }, [undoPending, refreshHistory])

  const handleUndo = useCallback(() => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current)
      clearTimeoutRef.current = null
    }
    setUndoPending(false)
    setUndoVisible(false)
    refreshHistory() // Restore the items
    setToastMessage('Clear undone — scans restored')
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }, [refreshHistory])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
    }
  }, [])

  // Handle "Add to Expenses" click
  const handleAddToExpenses = useCallback(async () => {
    if (!result) return

    // Build description from sender + ref_no
    const parts = []
    if (result.sender) parts.push(result.sender)
    if (result.ref_no) parts.push(result.ref_no)
    const description = parts.length > 0 ? parts.join(' - ') : 'Scanned receipt'

    // Convert uploaded file to base64 if available
    let receiptFile: string | null = null
    let receiptFileName: string | null = null
    if (uploadedFileRef.current) {
      try {
        receiptFile = await readFileAsDataURL(uploadedFileRef.current)
        receiptFileName = uploadedFileRef.current.name
      } catch {
        // Silently fail — receipt is optional
      }
    }

    const pending: PendingExpense = {
      amount: result.amount ? parseFloat(result.amount) : null,
      description,
      date: result.date || todayStr(),
      receiptFile,
      receiptFileName,
      rawOcrText: result.raw_text,
      detectedApp: result.detected_app,
    }

    localStorage.setItem('payproof_pending_expense', JSON.stringify(pending))

    // Show toast
    setToastMessage('Added to Expenses! View in Expenses tab')
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }, [result])

  return (
    <>
      <UploadZone onResult={handleResult} onError={setError} onFileRef={uploadedFileRef} />
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      {result && (
        <>
          <ResultCard result={result} onConfirm={handleConfirm} onAddToExpenses={handleAddToExpenses} />
          {/* Gamification bar */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <StreakBadge compact />
            <DailyGoal compact />
          </div>
        </>
      )}
      {/* Recent Payments — always visible */}
      <RecentPayments
        items={undoPending ? [] : confirmHistory}
        onRowClick={handleRowClick}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        clearing={undoPending}
      />
      <Toast message={toastMessage} visible={toastVisible} />
      <UndoToast
        message="All scans cleared"
        visible={undoVisible}
        onUndo={handleUndo}
        onDismiss={() => {
          if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
          setUndoPending(false)
          setUndoVisible(false)
          refreshHistory()
        }}
      />
    </>
  )
}
