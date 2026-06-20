# PayProof UI/UX Fixes

## Issue 1: Destructive actions have no confirmation or undo

**Files**: `frontend/src/pages/Expenses.tsx:614-623`

- `deleteExpense()` deletes instantly with no confirmation
- `clearAll()` uses ugly native `confirm()` dialog
- Mobile trash icons sit next to receipt actions — easy to fat-finger

### Fix

Replace native `confirm()` with a toast-based undo system:

```tsx
// Add undo toast state
const [pendingDelete, setPendingDelete] = useState<{ id: string; expense: Expense } | null>(null)
const [showUndo, setShowUndo] = useState(false)

// Delete with 5-second undo window
const deleteExpense = useCallback((id: string) => {
  const expense = expenses.find((e) => e.id === id)
  if (!expense) return
  setExpenses((prev) => prev.filter((e) => e.id !== id))
  setPendingDelete({ id, expense })
  setShowUndo(true)
  setTimeout(() => {
    setPendingDelete(null)
    setShowUndo(false)
  }, 5000)
}, [expenses])

// Undo handler
const undoDelete = useCallback(() => {
  if (!pendingDelete) return
  setExpenses((prev) => [...prev, pendingDelete.expense])
  setPendingDelete(null)
  setShowUndo(false)
}, [pendingDelete])
```

Add undo toast UI at the bottom of the Expenses return:

```tsx
{showUndo && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-[#3a3b40] bg-[#1a1b1f] px-4 py-3 shadow-lg shadow-black/40">
    <span className="text-[13px] text-[#b2bbc5]">Expense deleted</span>
    <button
      onClick={undoDelete}
      className="rounded-md bg-[#2e96ff] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#2e96ff]/90 transition-colors"
    >
      Undo
    </button>
  </div>
)}
```

Apply the same pattern to `clearAll()` — delete all into a temporary array, show undo toast, only permanently clear after timeout.

---

## Issue 2: Achievements page has no empty state

**File**: `frontend/src/pages/Achievements.tsx:19-22`

When `totalScans === 0`, the page shows three stat cards reading "0" with no context or call-to-action. New users see a dead page.

### Fix

Add an empty state guard before the stats grid:

```tsx
const isEmpty = totalScans === 0

return (
  <div>
    {/* Header */}
    <div className="mb-6">
      <h2 className="text-[20px] font-medium text-[#ffffff] sm:text-[24px]">Achievements</h2>
      <p className="mt-1 text-[13px] text-[#b2bbc5] sm:text-[14px]">
        Track your scanning progress and milestones
      </p>
    </div>

    {isEmpty ? (
      <div className="rounded-lg border border-dashed border-[#3a3b40] bg-[#1a1b1f] py-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2e96ff]/[0.12]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.3L12 14.5 7.1 17l.9-5.3-4-3.9L9.5 7z" stroke="#2e96ff" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-[14px] text-[#b2bbc5]">No achievements yet</p>
        <p className="mt-1 text-[12px] text-[#8e959f]">
          Scan your first receipt to start earning streaks and collecting apps
        </p>
        <a
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2e96ff] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2e96ff]/90 transition-colors"
        >
          Go to Scanner
        </a>
      </div>
    ) : (
      <>
        {/* Stats summary */}
        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
          {/* ...existing stats cards... */}
        </div>

        {/* Streak + Daily Goal */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StreakBadge />
          <DailyGoal />
        </div>

        {/* Receipt Pokedex */}
        <ReceiptPokedex />
      </>
    )}
  </div>
)
```

---

## Issue 3: Mobile sidebar has no persistent navigation affordance

**Files**: `frontend/src/App.tsx:54-66`, `frontend/src/components/Sidebar.tsx:109-129`

- The hamburger button is only visible when sidebar is closed
- No visual indicator that navigation exists
- Users must discover the hamburger icon on their own

### Fix

Replace the mobile drawer with a bottom tab bar. This is the standard mobile navigation pattern.

Add a new component `frontend/src/components/BottomNav.tsx`:

```tsx
import { useLocation, Link } from 'react-router-dom'

const TABS = [
  {
    label: 'Scan',
    path: '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="8" r="1.5" fill="currentColor" />
        <path d="M2 14l5-5 3 3 2.5-2.5L18 15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Expenses',
    path: '/expenses',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 3v5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 12h4M6 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Achieve',
    path: '/achievements',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.3L10 14.5 5.1 17l.9-5.3-4-3.9L7.5 7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#3a3b40] bg-[#1a1b1f] sm:hidden">
      <div className="flex items-center justify-around py-2">
        {TABS.map((tab) => {
          const isActive = tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path)

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
                isActive ? 'text-[#2e96ff]' : 'text-[#8e959f]'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

Update `App.tsx` to use it:

```tsx
import BottomNav from './components/BottomNav'

// Inside AppLayout return:
{isMobile && <BottomNav />}

// Adjust main content padding for bottom nav on mobile:
<main className="mx-auto w-full max-w-full flex-1 px-4 py-8 sm:max-w-lg sm:px-6 sm:py-10 md:max-w-xl lg:max-w-2xl pb-20 sm:pb-8">
```

Remove the mobile hamburger button and the drawer sidebar behavior. Keep the desktop sidebar as-is.

---

## Issue 4: Native `<select>` and no animations on form/list transitions

**Files**: `frontend/src/pages/Expenses.tsx:866-877`, line 784

- Native `<select>` renders ugly on iOS (full-screen picker) and doesn't match the dark theme
- Add Expense form pops in with no animation
- No swipe-to-delete on mobile cards

### Fix

**4a. Custom dropdown** — Replace the native `<select>` at line 866:

```tsx
// Add state for custom dropdown
const [catDropdownOpen, setCatDropdownOpen] = useState(false)
const catDropdownRef = useRef<HTMLDivElement>(null)

// Close on outside click
useEffect(() => {
  if (!catDropdownOpen) return
  function handler(e: MouseEvent) {
    if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
      setCatDropdownOpen(false)
    }
  }
  document.addEventListener('mousedown', handler)
  return () => document.removeEventListener('mousedown', handler)
}, [catDropdownOpen])

// Replace <select> with:
<div className="relative" ref={catDropdownRef}>
  <button
    onClick={() => setCatDropdownOpen((v) => !v)}
    className="flex w-full items-center justify-between rounded-md border border-[#3a3b40] bg-[#2a2b30] px-3 py-2 text-[13px] text-[#ffffff] outline-none focus:border-[#2e96ff] transition-colors"
  >
    {formCategory}
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#8e959f]">
      <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
  {catDropdownOpen && (
    <div className="absolute bottom-full mb-1 left-0 z-20 w-full rounded-lg border border-[#3a3b40] bg-[#1a1b1f] shadow-lg shadow-black/40 py-1">
      {categories.map((c) => (
        <button
          key={c}
          onClick={() => { setFormCategory(c); setCatDropdownOpen(false) }}
          className={`w-full px-3 py-2 text-left text-[13px] transition-colors ${
            formCategory === c
              ? 'bg-[#2e96ff]/[0.1] text-[#2e96ff]'
              : 'text-[#b2bbc5] hover:bg-[#2a2b30] hover:text-[#ffffff]'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  )}
</div>
```

**4b. Form animation** — Wrap the form div at line 784 with a CSS transition:

```tsx
{formOpen && (
  <div className="mb-6 rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-4 sm:p-5 animate-[slideDown_0.2s_ease-out]">
```

Add to `frontend/src/index.css`:

```css
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**4c. Swipe-to-delete on mobile** — Add a simple swipe handler to mobile expense cards:

```tsx
// Add to mobile card wrapper at line 1041
function SwipeableCard({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(0)
  const swiping = useRef(false)

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    swiping.current = true
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping.current) return
    const diff = e.touches[0].clientX - startX.current
    if (diff < 0) setOffset(Math.max(diff, -80))
  }

  function handleTouchEnd() {
    swiping.current = false
    if (offset < -60) {
      onDelete()
    }
    setOffset(0)
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Red delete background */}
      <div className="absolute inset-0 flex items-center justify-end rounded-lg bg-[#f28b82]/[0.15] pr-4">
        <span className="text-[12px] font-medium text-[#f28b82]">Delete</span>
      </div>
      {/* Foreground card */}
      <div
        className="relative transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
```

Wrap each mobile card:

```tsx
<SwipeableCard onDelete={() => deleteExpense(expense.id)}>
  <div className="rounded-lg border border-[#3a3b40] bg-[#1a1b1f] p-4">
    {/* ...existing card content... */}
  </div>
</SwipeableCard>
```

---

## Issue 5: Receipt popover clips off-screen and lacks keyboard support

**File**: `frontend/src/pages/Expenses.tsx:141-222`

- `ReceiptPopover` is `absolute right-0 top-full` — clips on last row or viewport edges
- No `Escape` key handler
- No focus trap — keyboard users can tab into hidden file inputs

### Fix

**5a. Dynamic positioning** — Replace the absolute positioning with a fixed-position popover that adjusts to viewport:

```tsx
function ReceiptPopover({
  open,
  onClose,
  onSelectFile,
  onSelectCamera,
  anchorRef,
}: {
  open: boolean
  onClose: () => void
  onSelectFile: (file: File) => void
  onSelectCamera: (file: File) => void
  anchorRef: React.RefObject<HTMLDivElement>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  // Calculate position from anchor
  useEffect(() => {
    if (!open || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const popoverWidth = 224 // w-56
    let left = rect.right - popoverWidth
    let top = rect.bottom + 4

    // Clamp to viewport
    if (left < 8) left = 8
    if (left + popoverWidth > window.innerWidth - 8) left = window.innerWidth - popoverWidth - 8
    if (top + 120 > window.innerHeight) top = rect.top - 120 - 4

    setPosition({ top, left })
  }, [open, anchorRef])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-56 rounded-lg border border-[#3a3b40] bg-[#1a1b1f] shadow-lg shadow-black/40"
      style={{ top: position.top, left: position.left }}
    >
      {/* ...existing button content... */}
    </div>
  )
}
```

Update the caller to pass `anchorRef`:

```tsx
// In each expense row, wrap the popover trigger + popover:
<div className="relative" ref={popoverAnchorRef}>
  <button onClick={...}>Attach</button>
  <ReceiptPopover
    open={popoverFor === expense.id}
    onClose={() => setPopoverFor(null)}
    onSelectFile={...}
    onSelectCamera={...}
    anchorRef={popoverAnchorRef}
  />
</div>
```

**5b. Focus trap** — When popover opens, focus the first button:

```tsx
// Add inside ReceiptPopover, after the position useEffect:
useEffect(() => {
  if (!open) return
  // Focus first interactive element
  const timer = setTimeout(() => {
    cameraRef.current?.focus()
  }, 50)
  return () => clearTimeout(timer)
}, [open])
```

**5c. Trap Tab key** inside the popover:

```tsx
function handleKeyDown(e: React.KeyboardEvent) {
  if (e.key !== 'Tab') return
  const focusable = popoverRef.current?.querySelectorAll('button, input')
  if (!focusable?.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
```

Add to the popover root div:

```tsx
<div ref={popoverRef} onKeyDown={handleKeyDown} ...>
```

---

## Summary

| # | Issue | Files to change | Effort |
|---|-------|-----------------|--------|
| 1 | Destructive actions need undo | `Expenses.tsx` | Small |
| 2 | Empty state for Achievements | `Achievements.tsx` | Small |
| 3 | Mobile bottom tab bar | `App.tsx`, new `BottomNav.tsx` | Medium |
| 4 | Custom dropdown + animations + swipe | `Expenses.tsx`, `index.css` | Medium |
| 5 | Popover positioning + keyboard | `Expenses.tsx` | Medium |
