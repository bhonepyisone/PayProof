// ── DailyGoal — Circular progress widget for daily scan target ──────────────
// Shows todayCount / target with a progress bar.

import { useState, useEffect } from 'react'
import { getDailyGoal, type DailyGoalData } from '../hooks/useGameState'

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
  const barColor = isComplete ? '#81c995' : '#2e96ff'
  const textColor = isComplete ? 'text-[#81c995]' : 'text-[#ffffff]'

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#3a3b40] bg-[#1a1b1f] px-2.5 py-1">
        <span className="text-[14px]">🎯</span>
        <span className={`text-[12px] font-semibold tabular-nums ${textColor}`}>
          {todayCount}/{target}
        </span>
        {isComplete && <span className="text-[12px]">✓</span>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-4 sm:p-5 transition-all duration-300 ease-in-out">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[24px] sm:text-[28px]">🎯</span>
        <div>
          <h3 className="text-[14px] font-medium text-[#ffffff] sm:text-[15px]">Daily Goal</h3>
          <p className="text-[11px] text-[#8e959f] sm:text-[12px]">
            {isComplete ? "Today's goal complete! 🎉" : `${todayCount} of ${target} receipts scanned today`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2a2b30]">
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
        <span className="text-[11px] text-[#8e959f] sm:text-[12px]">Progress</span>
        <span className={`text-[12px] font-semibold tabular-nums sm:text-[13px] ${textColor}`}>
          {todayCount} / {target}
        </span>
      </div>

      {isComplete && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-[#81c995]/[0.1] px-3 py-2">
          <span className="text-[14px]">🎉</span>
          <span className="text-[12px] font-medium text-[#81c995]">Goal reached!</span>
        </div>
      )}
    </div>
  )
}
