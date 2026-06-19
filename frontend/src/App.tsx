import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

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

// ── ConfidenceBadge ────────────────────────────────────────────────────────
function badgeConfig(status: OcrResult['review_status']) {
  switch (status) {
    case 'auto-accepted':
      return { label: '✅ Auto Accepted', classes: 'bg-green-100 text-green-800 border-green-300' }
    case 'manual-review':
      return { label: '⚠ Manual Review', classes: 'bg-amber-100 text-amber-800 border-amber-300' }
    case 'rejected':
      return { label: '❌ Rejected', classes: 'bg-red-100 text-red-800 border-red-300' }
  }
}

function ConfidenceBadge({
  status,
  confidence,
}: {
  status: OcrResult['review_status']
  confidence: number
}) {
  const { label, classes } = badgeConfig(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
      <span className="font-mono text-[10px] opacity-70">{confidence.toFixed(0)}%</span>
    </span>
  )
}

// ── FieldRow ───────────────────────────────────────────────────────────────
function FieldRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm font-mono text-gray-900">
        {value ?? <span className="text-red-400">—</span>}
      </dd>
    </div>
  )
}

// ── ResultCard ─────────────────────────────────────────────────────────────
function ResultCard({ result }: { result: OcrResult }) {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">OCR Result</h2>
        <ConfidenceBadge status={result.review_status} confidence={result.confidence} />
      </div>

      {/* Fields */}
      <dl>
        <FieldRow label="Amount" value={result.amount} />
        <FieldRow label="Ref No" value={result.ref_no} />
        <FieldRow label="Sender" value={result.sender} />
        <FieldRow label="Date" value={result.date} />
      </dl>

      {/* Confidence bar */}
      <div className="border-t border-amber-100 bg-amber-50/50 px-6 py-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Confidence</span>
          <span className="font-semibold">{result.confidence.toFixed(0)}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              result.confidence >= 95
                ? 'bg-green-500'
                : result.confidence >= 70
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(result.confidence, 100)}%` }}
          />
        </div>
      </div>

      {/* Raw OCR text (collapsible) */}
      {result.raw_text && (
        <details className="group border-t border-amber-100">
          <summary className="cursor-pointer px-6 py-3 text-xs font-medium text-gray-400 hover:text-gray-600 select-none">
            Raw OCR text
          </summary>
          <pre className="max-h-48 overflow-auto border-t border-amber-50 bg-amber-50/30 px-6 py-4 text-xs font-mono text-gray-600 whitespace-pre-wrap">
            {result.raw_text}
          </pre>
        </details>
      )}
    </div>
  )
}

// ── UploadZone ─────────────────────────────────────────────────────────────
function UploadZone({ onResult }: { onResult: (r: OcrResult) => void }) {
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return

      setLoading(true)
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/v1/ocr', { method: 'POST', body: form })
        const json = await res.json()
        if (json.success) onResult(json.data as OcrResult)
      } catch (err) {
        console.error('OCR request failed', err)
      } finally {
        setLoading(false)
      }
    },
    [onResult],
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
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-14 text-center transition-all duration-200 ${
        isDragActive
          ? 'border-amber-500 bg-amber-50'
          : 'border-amber-300 bg-white hover:border-amber-400 hover:bg-amber-50/50'
      }`}
    >
      <input {...getInputProps()} />

      {loading ? (
        <div className="space-y-3">
          <span className="text-3xl animate-pulse">🔍</span>
          <p className="text-lg font-medium text-amber-700">Processing OCR...</p>
          <p className="text-sm text-amber-500">Reading payment details from screenshot</p>
        </div>
      ) : isDragActive ? (
        <div className="space-y-2">
          <span className="text-4xl">📥</span>
          <p className="text-lg font-medium text-amber-600">Drop your screenshot here</p>
        </div>
      ) : (
        <div className="space-y-2">
          <span className="text-4xl">🧾</span>
          <p className="text-lg font-medium text-amber-700">
            Drag & drop a KBZ Pay screenshot
          </p>
          <p className="text-sm text-amber-400">PNG, JPG, or WebP — one image at a time</p>
        </div>
      )}
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [result, setResult] = useState<OcrResult | null>(null)

  const handleResult = useCallback((r: OcrResult) => {
    // Clear any previous result so a re-scan shows the new upload zone first
    setResult(null)
    // Small delay to let the UI reset before rendering the new result
    requestAnimationFrame(() => setResult(r))
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <div className="mx-auto max-w-2xl px-4 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-amber-600">PayProof</h1>
          <p className="mt-2 text-lg font-medium text-amber-500">
            OCR Payment Proof Connector
          </p>
          <p className="mt-3 text-sm text-amber-400">On-device · Privacy-first · KBZ Pay</p>
        </div>

        {/* Upload zone — always visible so user can scan again */}
        <UploadZone onResult={handleResult} />

        {/* Result — shown only when we have data */}
        {result && <ResultCard result={result} />}
      </div>
    </main>
  )
}
