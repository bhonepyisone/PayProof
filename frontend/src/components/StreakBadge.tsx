// ── StreakBadge — Compact streak display ────────────────────────────────────
// Shows fire icon + streak number with optional subtext for milestones.

import { useState, useEffect } from 'react'
import { getStreak, type StreakData } from '../hooks/useGameState'
import { cn } from '../lib/utils'

// ── SVG Icons ──────────────────────────────────────────────────────────────
function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2c0 0-6 5-6 10a6 6 0 0012 0c0-3-2-5-3-7-1 2-3 3-3 3s-2-2 0-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 14c0-1.5 1-3 1-3s-2 1-2 3a2 2 0 004 0c0-1-1-2-1-2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M8 1L3 8h4l1 5 5-7H7l1-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────────────
interface StreakBadgeProps {
  compact?: boolean // true = inline badge, false = large card
}

export default function StreakBadge({ compact = false }: StreakBadgeProps) {
  const [streak, setStreak] = useState<StreakData>(getStreak())

  // Re-read on mount (in case state changed)
  useEffect(() => {
    setStreak(getStreak())
  }, [])

  const { currentStreak, longestStreak } = streak

  // Milestone subtext
  let subtext: string | null = null
  if (currentStreak >= 30) {
    subtext = 'Legendary!'
  } else if (currentStreak >= 7) {
    subtext = 'Week Warrior'
  }

  // Glow effect for 30+ day streaks
  const glowClass = currentStreak >= 30 ? 'shadow-[0_0_12px_rgba(253,214,99,0.3)]' : ''

  if (compact) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2.5 py-2 min-h-[44px]',
        glowClass
      )}>
        <FireIcon className="h-4 w-4 text-[var(--color-amber)]" />
        <span className="text-[12px] font-semibold text-[var(--color-text-primary)] tabular-nums">{currentStreak}</span>
        <span className="text-[10px] text-[var(--color-text-muted)]">day{currentStreak !== 1 ? 's' : ''}</span>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 sm:p-5 transition-all duration-300 ease-in-out',
      glowClass
    )}>
      <div className="flex items-center gap-3">
        <FireIcon className="h-7 w-7 sm:h-8 sm:w-8 text-[var(--color-amber)]" />
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[24px] font-bold text-[var(--color-text-primary)] tabular-nums sm:text-[28px]">
              {currentStreak}
            </span>
            <span className="text-[13px] text-[var(--color-text-muted)] sm:text-[14px]">
              day{currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
          {subtext && (
            <p className="mt-0.5 text-[11px] font-medium text-[var(--color-amber)] sm:text-[12px] flex items-center gap-1">
              {currentStreak >= 30 && <BoltIcon className="h-3 w-3" />}
              {subtext}
            </p>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-text-muted)] sm:text-[12px]">
        Longest: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
