// ── useGameState — Gamification state via localStorage ──────────────────────
// Manages streak, daily goal, and receipt Pokédex data.

// ── Types ──────────────────────────────────────────────────────────────────
export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastScanDate: string | null // "YYYY-MM-DD"
}

export interface DailyGoalData {
  target: number // default 5
  todayDate: string // "YYYY-MM-DD"
  todayCount: number
}

export interface PokedexEntry {
  count: number
  firstScan: string // ISO date string
}

export interface PokedexData {
  apps: Record<string, PokedexEntry>
}

// ── Constants ──────────────────────────────────────────────────────────────
const STREAK_KEY = 'payproof_streak'
const DAILY_GOAL_KEY = 'payproof_daily_goal'
const POKEDEX_KEY = 'payproof_pokedex'
const DEFAULT_DAILY_TARGET = 5

// ── Helpers ────────────────────────────────────────────────────────────────
function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// ── Streak ─────────────────────────────────────────────────────────────────
export function getStreak(): StreakData {
  const data = readJSON<StreakData>(STREAK_KEY, {
    currentStreak: 0,
    longestStreak: 0,
    lastScanDate: null,
  })

  // Check if streak is still alive
  const today = todayStr()
  const yesterday = yesterdayStr()

  if (data.lastScanDate === today || data.lastScanDate === yesterday) {
    // Streak is alive (scanned today or yesterday)
    return data
  }

  // Streak is dead — reset
  return {
    currentStreak: 0,
    longestStreak: data.longestStreak,
    lastScanDate: data.lastScanDate,
  }
}

function updateStreak(): void {
  const data = getStreak()
  const today = todayStr()
  const yesterday = yesterdayStr()

  if (data.lastScanDate === today) {
    // Already scanned today — no change
    return
  }

  let newStreak: number
  if (data.lastScanDate === yesterday) {
    // Scanned yesterday — increment streak
    newStreak = data.currentStreak + 1
  } else {
    // Streak was dead — start fresh
    newStreak = 1
  }

  const newLongest = Math.max(data.longestStreak, newStreak)

  writeJSON(STREAK_KEY, {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastScanDate: today,
  })
}

// ── Daily Goal ─────────────────────────────────────────────────────────────
export function getDailyGoal(): DailyGoalData {
  const today = todayStr()
  const data = readJSON<DailyGoalData>(DAILY_GOAL_KEY, {
    target: DEFAULT_DAILY_TARGET,
    todayDate: today,
    todayCount: 0,
  })

  // Reset if it's a new day
  if (data.todayDate !== today) {
    return {
      target: data.target,
      todayDate: today,
      todayCount: 0,
    }
  }

  return data
}

function updateDailyGoal(): void {
  const data = getDailyGoal()
  const today = todayStr()

  writeJSON(DAILY_GOAL_KEY, {
    target: data.target,
    todayDate: today,
    todayCount: data.todayCount + 1,
  })
}

export function resetDailyGoal(): void {
  const data = getDailyGoal()
  writeJSON(DAILY_GOAL_KEY, {
    target: DEFAULT_DAILY_TARGET,
    todayDate: data.todayDate,
    todayCount: 0,
  })
}

// ── Pokédex ────────────────────────────────────────────────────────────────
export function getPokedex(): PokedexData {
  return readJSON<PokedexData>(POKEDEX_KEY, { apps: {} })
}

function updatePokedex(appName: string): void {
  const data = getPokedex()
  const today = todayStr()

  if (data.apps[appName]) {
    data.apps[appName].count += 1
  } else {
    data.apps[appName] = {
      count: 1,
      firstScan: today,
    }
  }

  writeJSON(POKEDEX_KEY, data)
}

// ── Public API ─────────────────────────────────────────────────────────────
export function recordScan(appName: string): void {
  updateStreak()
  updateDailyGoal()
  updatePokedex(appName)
}
