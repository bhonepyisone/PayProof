// ── Achievements Page — Full gamification dashboard ──────────────────────────
// Shows streak, daily goal, receipt Pokédex, and stats summary.

import { useState, useEffect } from 'react'
import { getStreak, getPokedex, type StreakData, type PokedexData } from '../hooks/useGameState'
import StreakBadge from '../components/StreakBadge'
import DailyGoal from '../components/DailyGoal'
import ReceiptPokedex from '../components/ReceiptPokedex'

export default function Achievements() {
  const [streak, setStreak] = useState<StreakData>(getStreak())
  const [pokedex, setPokedex] = useState<PokedexData>(getPokedex())

  useEffect(() => {
    setStreak(getStreak())
    setPokedex(getPokedex())
  }, [])

  // Stats
  const totalScans = Object.values(pokedex.apps).reduce((sum, app) => sum + app.count, 0)
  const appsCollected = Object.keys(pokedex.apps).length
  const longestStreak = streak.longestStreak

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[20px] font-medium text-[#ffffff] sm:text-[24px]">Achievements</h2>
        <p className="mt-1 text-[13px] text-[#b2bbc5] sm:text-[14px]">
          Track your scanning progress and milestones
        </p>
      </div>

      {/* Stats summary */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-3 text-center sm:p-4">
          <p className="text-[20px] font-bold text-[#ffffff] tabular-nums sm:text-[24px]">{totalScans}</p>
          <p className="text-[11px] text-[#8e959f] sm:text-[12px]">Total Scans</p>
        </div>
        <div className="rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-3 text-center sm:p-4">
          <p className="text-[20px] font-bold text-[#ffffff] tabular-nums sm:text-[24px]">{appsCollected}</p>
          <p className="text-[11px] text-[#8e959f] sm:text-[12px]">Apps Collected</p>
        </div>
        <div className="rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-3 text-center sm:p-4">
          <p className="text-[20px] font-bold text-[#ffffff] tabular-nums sm:text-[24px]">{longestStreak}</p>
          <p className="text-[11px] text-[#8e959f] sm:text-[12px]">Longest Streak</p>
        </div>
      </div>

      {/* Streak + Daily Goal side by side on desktop */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StreakBadge />
        <DailyGoal />
      </div>

      {/* Receipt Pokédex */}
      <ReceiptPokedex />
    </div>
  )
}
