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
    <div className="inline-flex items-center gap-2 rounded-full border border-[#3a3b40] bg-[#2a2b30] px-3 py-1">
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      <span className={cn('text-xs font-medium', config.text)}>{config.label}</span>
      <span className="text-[11px] font-medium text-[#8e959f] tabular-nums">
        {confidence.toFixed(0)}%
      </span>
    </div>
  )
}

// ── FieldRow ───────────────────────────────────────────────────────────────
function FieldRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-[13px] font-medium text-[#8e959f]">{label}</span>
      <span className="text-[14px] font-medium text-[#ffffff] tabular-nums">
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
        'cursor-pointer rounded-lg border border-dashed p-16 text-center transition-colors duration-200',
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
          <p className="text-[15px] font-medium text-[#b2bbc5]">Processing OCR…</p>
        </div>
      ) : isDragActive ? (
        <div className="flex flex-col items-center gap-3">
          <UploadIcon className="text-[#2e96ff]" />
          <p className="text-[15px] font-medium text-[#2e96ff]">Drop your screenshot</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <UploadIcon />
          <div>
            <p className="text-[15px] font-medium text-[#b2bbc5]">
              Drag & drop a KBZ Pay screenshot
            </p>
            <p className="mt-1 text-[13px] text-[#8e959f]">
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
      <div className="flex items-center justify-between border-b border-[#3a3b40] px-5 py-4">
        <h2 className="text-[15px] font-medium text-[#ffffff]">OCR Result</h2>
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
      <div className="border-t border-[#3a3b40] px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-medium text-[#8e959f]">Confidence</span>
          <span className="text-[12px] font-medium text-[#b2bbc5] tabular-nums">
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
          <summary className="cursor-pointer px-5 py-3 text-[12px] font-medium text-[#8e959f] hover:text-[#b2bbc5] select-none">
            Raw OCR text
          </summary>
          <pre className="max-h-48 overflow-auto border-t border-[#3a3b40] bg-[#121317] px-5 py-4 text-[12px] font-mono leading-relaxed text-[#b2bbc5] whitespace-pre-wrap">
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
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#f28b82]/30 bg-[#f28b82]/[0.08] px-4 py-3">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="mt-0.5 shrink-0">
        <circle cx="9" cy="9" r="8" stroke="#f28b82" strokeWidth="1.5" />
        <path d="M9 5v4M9 12v1" stroke="#f28b82" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#f28b82]">OCR server error</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[#b2bbc5]">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-[#8e959f] hover:text-[#ffffff] transition-colors"
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
      <div className="mx-auto w-full max-w-[672px] px-4 py-20">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2e96ff]/[0.12]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="12" rx="2" stroke="#2e96ff" strokeWidth="1.5" />
              <path d="M7 10h4M7 14h2" stroke="#2e96ff" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="15.5" cy="10.5" r="2" stroke="#2e96ff" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className="text-[28px] font-medium tracking-tight text-[#ffffff]">
            PayProof
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#b2bbc5]">
            OCR Payment Proof Connector
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-[12px] text-[#8e959f]">
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
