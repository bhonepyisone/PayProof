import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

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
interface OcrResult {
  amount: string | null
  ref_no: string | null
  sender: string | null
  date: string | null
  confidence: number
  review_status: 'auto-accepted' | 'manual-review' | 'rejected'
  raw_text: string | null
  template: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
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
    'auto-accepted': { dot: 'bg-[#81c995]', text: 'text-[#81c995]', label: 'Auto-accepted' },
    'manual-review': { dot: 'bg-[#fdd663]', text: 'text-[#fdd663]', label: 'Manual review' },
    rejected:         { dot: 'bg-[#f28b82]', text: 'text-[#f28b82]', label: 'Rejected' },
  }[status]

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[#3a3b40] bg-[#2a2b30] px-2.5 py-1 sm:gap-2 sm:px-3">
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      <span className={cn('text-[11px] font-medium sm:text-xs', config.text)}>{config.label}</span>
      <span className="text-[10px] font-medium text-[#8e959f] tabular-nums sm:text-[11px]">
        {confidence.toFixed(0)}%
      </span>
    </div>
  )
}

// ── FieldRow ───────────────────────────────────────────────────────────────
function FieldRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
      <span className="text-[12px] font-medium text-[#8e959f] sm:text-[13px]">{label}</span>
      <span className="text-[14px] font-medium text-[#ffffff] tabular-nums sm:text-[14px]">
        {value ?? <span className="text-[#f28b82]">—</span>}
      </span>
    </div>
  )
}

// ── UploadIcon (SVG, no emoji) ─────────────────────────────────────────────
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48" height="48" viewBox="0 0 48 48" fill="none"
    >
      <rect x="6" y="10" width="36" height="28" rx="3" stroke="#8e959f" strokeWidth="1.5" />
      <circle cx="17" cy="20" r="3" fill="#8e959f" />
      <path d="M6 32l10-10 8 8 6-6 12 12" stroke="#8e959f" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

// ── UploadZone ─────────────────────────────────────────────────────────────
function UploadZone({
  onResult,
  onError,
}: {
  onResult: (r: OcrResult) => void
  onError: (msg: string) => void
}) {
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return

      setLoading(true)
      onError('')
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/v1/ocr', { method: 'POST', body: form })
        const json = await res.json()
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
    [onResult, onError],
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
          ? 'border-[#2e96ff] bg-[#2e96ff]/[0.06]'
          : 'border-[#3a3b40] bg-[#1a1b1f] hover:border-[#8e959f]',
      )}
    >
      <input {...getInputProps()} />

      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#2e96ff]" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#2e96ff] [animation-delay:150ms]" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#2e96ff] [animation-delay:300ms]" />
          </div>
          <p className="text-[14px] font-medium text-[#b2bbc5] sm:text-[15px]">Processing OCR…</p>
        </div>
      ) : isDragActive ? (
        <div className="flex flex-col items-center gap-3">
          <UploadIcon className="text-[#2e96ff]" />
          <p className="text-[14px] font-medium text-[#2e96ff] sm:text-[15px]">Drop your screenshot</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <UploadIcon />
          <div>
            <p className="text-[14px] font-medium text-[#b2bbc5] sm:text-[15px]">
              Drag & drop a KBZ Pay screenshot
            </p>
            <p className="mt-1 text-[12px] text-[#8e959f] sm:text-[13px]">
              PNG, JPG, or WebP — one image at a time
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ResultCard ─────────────────────────────────────────────────────────────
function ResultCard({ result }: { result: OcrResult }) {
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-[#3a3b40] bg-[#1a1b1f]">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-[#3a3b40] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <h2 className="text-[14px] font-medium text-[#ffffff] sm:text-[15px]">OCR Result</h2>
        <ConfidenceBadge status={result.review_status} confidence={result.confidence} />
      </div>

      {/* Fields */}
      <div className="divide-y divide-[#3a3b40]">
        <FieldRow label="Amount" value={result.amount} />
        <FieldRow label="Ref No" value={result.ref_no} />
        <FieldRow label="Sender" value={result.sender} />
        <FieldRow label="Date" value={result.date} />
      </div>

      {/* Confidence bar */}
      <div className="border-t border-[#3a3b40] px-4 py-3 sm:px-5 sm:py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#8e959f] sm:text-[12px]">Confidence</span>
          <span className="text-[11px] font-medium text-[#b2bbc5] tabular-nums sm:text-[12px]">
            {result.confidence.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2a2b30]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(result.confidence, 100)}%`,
              backgroundColor:
                result.confidence >= 95 ? '#81c995' : result.confidence >= 70 ? '#fdd663' : '#f28b82',
            }}
          />
        </div>
      </div>

      {/* Raw OCR text */}
      {result.raw_text && (
        <details className="group border-t border-[#3a3b40]">
          <summary className="cursor-pointer px-4 py-3 text-[11px] font-medium text-[#8e959f] hover:text-[#b2bbc5] select-none sm:px-5 sm:text-[12px]">
            Raw OCR text
          </summary>
          <pre className="max-h-48 overflow-auto border-t border-[#3a3b40] bg-[#121317] px-4 py-3 text-[11px] font-mono leading-relaxed text-[#b2bbc5] whitespace-pre-wrap sm:px-5 sm:py-4 sm:text-[12px]">
            {result.raw_text}
          </pre>
        </details>
      )}
    </div>
  )
}

// ── ErrorBanner ────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  if (!message) return null
  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#f28b82]/30 bg-[#f28b82]/[0.08] px-3 py-3 sm:px-4">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="mt-0.5 shrink-0">
        <circle cx="9" cy="9" r="8" stroke="#f28b82" strokeWidth="1.5" />
        <path d="M9 5v4M9 12v1" stroke="#f28b82" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[#f28b82] sm:text-[13px]">OCR server error</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[#b2bbc5] sm:text-[12px]">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 text-[#8e959f] hover:text-[#ffffff] transition-colors"
        aria-label="Dismiss error"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [result, setResult] = useState<OcrResult | null>(null)
  const [error, setError] = useState('')

  const handleResult = useCallback((r: OcrResult) => {
    setResult(null)
    requestAnimationFrame(() => setResult(r))
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-full px-4 py-10 sm:max-w-lg sm:px-6 sm:py-14 md:max-w-xl lg:max-w-2xl lg:py-20">
        {/* Header */}
        <header className="mb-6 text-center sm:mb-10">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e96ff]/[0.12] sm:mb-5 sm:h-12 sm:w-12">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="12" rx="2" stroke="#2e96ff" strokeWidth="1.5" />
              <path d="M7 10h4M7 14h2" stroke="#2e96ff" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="15.5" cy="10.5" r="2" stroke="#2e96ff" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className="text-[22px] font-medium tracking-tight text-[#ffffff] sm:text-[28px]">
            PayProof
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#b2bbc5] sm:mt-2 sm:text-[15px]">
            OCR Payment Proof Connector
          </p>
          <p className="mt-2.5 inline-flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-[#8e959f] sm:mt-3 sm:gap-2 sm:text-[12px]">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#81c995]" />
              On-device
            </span>
            <span className="text-[#3a3b40]">·</span>
            <span>Privacy-first</span>
            <span className="text-[#3a3b40]">·</span>
            <span>KBZ Pay</span>
          </p>
        </header>

        {/* Upload zone */}
        <UploadZone onResult={handleResult} onError={setError} />

        {/* Error state */}
        <ErrorBanner message={error} onDismiss={() => setError('')} />

        {/* Result */}
        {result && <ResultCard result={result} />}
      </div>
    </div>
  )
}
