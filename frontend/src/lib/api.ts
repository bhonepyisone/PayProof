/**
 * API client — resolves backend URL from env or falls back to same-origin.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function ocrUpload(file: File): Promise<any> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/v1/ocr`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`OCR failed: ${res.status}`)
  return res.json()
}

/**
 * Mark an OCR scan as manually confirmed (user verified payment in their bank app).
 */
export async function confirmScan(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/api/v1/ocr/${id}/confirm`, { method: 'POST' })
  if (!res.ok) throw new Error(`Confirm failed: ${res.status}`)
  return res.json()
}

/**
 * Fetch OCR scan history with confirmation status, newest first.
 */
export async function getScanHistory(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/v1/ocr`)
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`)
  return res.json()
}
