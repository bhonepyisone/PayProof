// ── StreakBadge — Compact streak display ────────────────────────────────────
// Shows fire emoji + streak number with optional subtext for milestones.

import { useState, useEffect } from 'react'
import { getStreak, type StreakData } from '../hooks/useGameState'

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
    subtext = '🔥 Legendary!'
  } else if (currentStreak >= 7) {
    subtext = 'Week Warrior'
  }

  // Glow effect for 30+ day streaks
  const glowClass = currentStreak >= 30 ? 'shadow-[0_0_12px_rgba(253,214,99,0.3)]' : ''

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full border border-[#3a3b40] bg-[#1a1b1f] px-2.5 py-1 ${glowClass}`}>
        <span className="text-[14px]">🔥</span>
        <span className="text-[12px] font-semibold text-[#ffffff] tabular-nums">{currentStreak}</span>
        <span className="text-[10px] text-[#8e959f]">day{currentStreak !== 1 ? 's' : ''}</span>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-4 sm:p-5 ${glowClass} transition-all duration-300 ease-in-out`}>
      <div className="flex items-center gap-3">
        <span className="text-[28px] sm:text-[32px]">🔥</span>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[24px] font-bold text-[#ffffff] tabular-nums sm:text-[28px]">
              {currentStreak}
            </span>
            <span className="text-[13px] text-[#8e959f] sm:text-[14px]">
              day{currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
          {subtext && (
            <p className="mt-0.5 text-[11px] font-medium text-[#fdd663] sm:text-[12px]">
              {subtext}
            </p>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-[#8e959f] sm:text-[12px]">
        Longest: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
