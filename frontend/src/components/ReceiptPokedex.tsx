// ── ReceiptPokedex — Grid of collected/uncollected payment apps ──────────────
// Shows which payment apps the user has scanned receipts from.

import { useState, useEffect } from 'react'
import { getPokedex, type PokedexData } from '../hooks/useGameState'

// Known payment apps (always shown, even if uncollected)
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
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#3a3b40] bg-[#1a1b1f] px-2.5 py-1">
        <span className="text-[14px]">📸</span>
        <span className="text-[12px] font-semibold text-[#ffffff] tabular-nums">{totalCollected}</span>
        <span className="text-[10px] text-[#8e959f]">apps</span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-4 sm:p-5 transition-all duration-300 ease-in-out">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[24px] sm:text-[28px]">📸</span>
        <div>
          <h3 className="text-[14px] font-medium text-[#ffffff] sm:text-[15px]">Receipt Collection</h3>
          <p className="text-[11px] text-[#8e959f] sm:text-[12px]">
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
              className={`rounded-lg border p-3 text-center transition-all duration-300 ease-in-out ${
                isCollected
                  ? 'border-[#81c995]/50 bg-[#81c995]/[0.05]'
                  : 'border-dashed border-[#3a3b40] bg-[#121317]'
              }`}
            >
              <p className={`text-[12px] font-medium truncate sm:text-[13px] ${
                isCollected ? 'text-[#ffffff]' : 'text-[#8e959f]'
              }`}>
                {appName}
              </p>
              {isCollected ? (
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span className="text-[#81c995] text-[12px]">✓</span>
                  <span className="text-[11px] font-semibold text-[#81c995] tabular-nums">
                    {entry.count}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-[10px] text-[#8e959f]">New!</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Hidden count */}
      {hiddenCount > 0 && (
        <p className="mt-2 text-[11px] text-[#8e959f] text-center">
          +{hiddenCount} more
        </p>
      )}
    </div>
  )
}
