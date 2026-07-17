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
