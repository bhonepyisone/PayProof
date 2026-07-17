import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import OcrScanner from './pages/OcrScanner'
import Expenses from './pages/Expenses'
import Achievements from './pages/Achievements'

// ── Mobile detection hook ──────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

function AppLayout() {
  const isMobile = useIsMobile()
  const [sidebarExpanded, setSidebarExpanded] = useState(!isMobile)

  // Auto-collapse on mobile, auto-expand on desktop
  useEffect(() => {
    setSidebarExpanded(!isMobile)
  }, [isMobile])

  return (
    <div className="flex min-h-screen bg-[#121317]">
      {/* Sidebar */}
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((prev) => !prev)}
        isMobile={isMobile}
      />

      {/* Main content area */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile top bar */}
        {isMobile && (
          <div className="sticky top-0 z-30 flex h-14 items-center border-b border-[#3a3b40] bg-[#1a1b1f] px-4">
            <span className="text-[15px] font-medium text-[#ffffff]">PayProof</span>
          </div>
        )}

        {/* Page content */}
        <main className="mx-auto w-full max-w-full flex-1 px-4 py-8 sm:max-w-lg sm:px-6 sm:py-10 md:max-w-xl lg:max-w-2xl pb-20 sm:pb-8">
          <Routes>
            <Route path="/" element={<OcrScanner />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/achievements" element={<Achievements />} />
          </Routes>
        </main>

        {/* Mobile bottom tab bar */}
        {isMobile && <BottomNav />}
      </div>
    </div>
  )
}
