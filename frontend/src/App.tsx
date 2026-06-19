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
  template: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
function badgeColor(status: OcrResult['review_status']) {
  switch (status) {
    case 'auto-accepted':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'manual-review':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300'
  }
}

function badgeLabel(status: OcrResult['review_status']) {
  switch (status) {
    case 'auto-accepted':
      return '✓ Auto-accepted'
    case 'manual-review':
      return '⚠ Manual review'
    case 'rejected':
      return '✗ Rejected'
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

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
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-14 text-center transition-all duration-200
        ${isDragActive
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

function ResultCard({ result }: { result: OcrResult }) {
  const fields = [
    { label: 'Amount', value: result.amount, unit: 'MMK' },
    { label: 'Reference No.', value: result.ref_no },
    { label: 'Sender', value: result.sender },
    { label: 'Date', value: result.date },
  ]

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">Extracted Details</h2>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeColor(result.review_status)}`}
        >
          {badgeLabel(result.review_status)}
        </span>
      </div>

      {/* Fields */}
      <dl className="divide-y divide-amber-50 px-6 py-2">
        {fields.map((f) => (
          <div
            key={f.label}
            className="flex items-center justify-between py-4"
          >
            <dt className="text-sm font-medium text-gray-500">{f.label}</dt>
            <dd className="text-sm font-semibold text-gray-900">
              {f.value ?? (
                <span className="italic text-gray-300">not found</span>
              )}
              {f.unit && f.value && (
                <span className="ml-1 text-xs font-normal text-gray-400">{f.unit}</span>
              )}
            </dd>
          </div>
        ))}
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
            style={{ width: `${result.confidence}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [result, setResult] = useState<OcrResult | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <div className="mx-auto max-w-2xl px-4 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-amber-600">
            PayProof
          </h1>
          <p className="mt-2 text-lg font-medium text-amber-500">
            OCR Payment Proof Connector
          </p>
          <p className="mt-3 text-sm text-amber-400">
            On-device · Privacy-first · KBZ Pay
          </p>
        </div>

        {/* Upload */}
        <UploadZone onResult={setResult} />

        {/* Result */}
        {result && <ResultCard result={result} />}
      </div>
    </main>
  )
}
