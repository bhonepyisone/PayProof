// ── ReceiptPokedex — Grid of collected/uncollected payment apps ──────────────
// Shows which payment apps the user has scanned receipts from.

import { useState, useEffect } from 'react'
import { getPokedex, type PokedexData } from '../hooks/useGameState'
import { cn } from '../lib/utils'

// ── SVG Icons ──────────────────────────────────────────────────────────────
function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10.5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 4l1 2h3a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V7a1 1 0 011-1h3l1-2h8z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Known payment apps ─────────────────────────────────────────────────────
const KNOWN_APPS = [
  'KBZ Pay',
  'Wave Money',
  'AYA Pay',
  'CB Pay',
  'Bank Transfer',
  'Shop Receipt',
]

interface ReceiptPokedexProps {
  compact?: boolean // true = small grid, false = full grid
  maxVisible?: number // max apps to show in compact mode
}

export default function ReceiptPokedex({ compact = false, maxVisible = 6 }: ReceiptPokedexProps) {
  const [pokedex, setPokedex] = useState<PokedexData>(getPokedex())

  useEffect(() => {
    setPokedex(getPokedex())
  }, [])

  const { apps } = pokedex
  const collectedApps = Object.keys(apps)
  const allApps = [...new Set([...KNOWN_APPS, ...collectedApps])]

  // Limit visible apps in compact mode
  const visibleApps = compact ? allApps.slice(0, maxVisible) : allApps
  const hiddenCount = allApps.length - visibleApps.length

  // Stats
  const totalCollected = collectedApps.length
  const totalScans = collectedApps.reduce((sum, app) => sum + apps[app].count, 0)

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2.5 py-2 min-h-[44px]">
        <CameraIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
        <span className="text-[12px] font-semibold text-[var(--color-text-primary)] tabular-nums">{totalCollected}</span>
        <span className="text-[10px] text-[var(--color-text-muted)]">apps</span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 sm:p-5 transition-all duration-300 ease-in-out">
      <div className="flex items-center gap-3 mb-4">
        <CameraIcon className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--color-primary)]" />
        <div>
          <h3 className="text-[14px] font-medium text-[var(--color-text-primary)] sm:text-[15px]">Receipt Collection</h3>
          <p className="text-[11px] text-[var(--color-text-muted)] sm:text-[12px]">
            {totalCollected} app{totalCollected !== 1 ? 's' : ''} collected · {totalScans} total scan{totalScans !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* App grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visibleApps.map((appName) => {
          const entry = apps[appName]
          const isCollected = !!entry

          return (
            <div
              key={appName}
              className={cn(
                'rounded-lg border p-3 text-center transition-all duration-300 ease-in-out',
                isCollected
                  ? 'border-[var(--color-green)]/50 bg-[var(--color-green)]/[0.05]'
                  : 'border-dashed border-[var(--color-border)] bg-[var(--color-bg-page)]'
              )}
            >
              <p className={cn(
                'text-[12px] font-medium truncate sm:text-[13px]',
                isCollected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
              )}>
                {appName}
              </p>
              {isCollected ? (
                <div className="mt-1 flex items-center justify-center gap-1">
                  <CheckIcon className="h-3.5 w-3.5 text-[var(--color-green)]" />
                  <span className="text-[11px] font-semibold text-[var(--color-green)] tabular-nums">
                    {entry.count}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">New!</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Hidden count */}
      {hiddenCount > 0 && (
        <p className="mt-2 text-[11px] text-[var(--color-text-muted)] text-center">
          +{hiddenCount} more
        </p>
      )}
    </div>
  )
}
