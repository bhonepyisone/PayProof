// ── Shared utilities ────────────────────────────────────────────────────────
// Centralized helpers used across multiple components.

/**
 * Merge class names, filtering out falsy values.
 * Works without external dependencies like clsx/tailwind-merge.
 */
export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Get today's date as "YYYY-MM-DD" string.
 */
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Read a File object as a base64 data URL.
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Format a date string for display (e.g., "Jun 23, 2026").
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Format a number with thousands separators (no decimals).
 */
export function formatAmount(amount: number): string {
  if (isNaN(amount)) return '—'
  return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
