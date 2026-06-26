// ── DailyGoal — Progress widget for daily scan target ───────────────────────
// Shows todayCount / target with a progress bar.

import { useState, useEffect } from 'react'
import { getDailyGoal, type DailyGoalData } from '../hooks/useGameState'
import { cn } from '../lib/utils'

// ── SVG Icons ──────────────────────────────────────────────────────────────
function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
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

function PartyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5l1.5-1.5M11 5l1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────────────
interface DailyGoalProps {
  compact?: boolean // true = inline badge, false = large card
}

export default function DailyGoal({ compact = false }: DailyGoalProps) {
  const [goal, setGoal] = useState<DailyGoalData>(getDailyGoal())

  // Re-read on mount
  useEffect(() => {
    setGoal(getDailyGoal())
  }, [])

  const { todayCount, target } = goal
  const progress = Math.min(todayCount / target, 1)
  const isComplete = todayCount >= target

  // Colors
  const barColor = isComplete ? 'var(--color-green)' : 'var(--color-primary)'
  const textColor = isComplete ? 'text-[var(--color-green)]' : 'text-[var(--color-text-primary)]'

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2.5 py-2 min-h-[44px]">
        <TargetIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
        <span className={cn('text-[12px] font-semibold tabular-nums', textColor)}>
          {todayCount}/{target}
        </span>
        {isComplete && <CheckIcon className="h-3.5 w-3.5 text-[var(--color-green)]" />}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 sm:p-5 transition-all duration-300 ease-in-out">
      <div className="flex items-center gap-3 mb-3">
        <TargetIcon className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--color-primary)]" />
        <div>
          <h3 className="text-[14px] font-medium text-[var(--color-text-primary)] sm:text-[15px]">Daily Goal</h3>
          <p className="text-[11px] text-[var(--color-text-muted)] sm:text-[12px]">
            {isComplete ? "Today's goal complete!" : `${todayCount} of ${target} receipts scanned today`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      {/* Count */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-text-muted)] sm:text-[12px]">Progress</span>
        <span className={cn('text-[12px] font-semibold tabular-nums sm:text-[13px]', textColor)}>
          {todayCount} / {target}
        </span>
      </div>

      {isComplete && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-[var(--color-green)]/[0.1] px-3 py-2">
          <PartyIcon className="h-4 w-4 text-[var(--color-green)]" />
          <span className="text-[12px] font-medium text-[var(--color-green)]">Goal reached!</span>
        </div>
      )}
    </div>
  )
}
