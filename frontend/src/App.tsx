import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import OcrScanner from './pages/OcrScanner'
import Expenses from './pages/Expenses'

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
        {/* Mobile top bar — shows toggle when sidebar is hidden */}
        {isMobile && (
          <div className="sticky top-0 z-30 flex h-14 items-center border-b border-[#3a3b40] bg-[#1a1b1f] px-4">
            <button
              onClick={() => setSidebarExpanded(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#b2bbc5] hover:bg-[#2a2b30] hover:text-[#ffffff] transition-colors"
              aria-label="Open navigation"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="ml-3 text-[15px] font-medium text-[#ffffff]">PayProof</span>
          </div>
        )}

        {/* Page content */}
        <main className="mx-auto w-full max-w-full flex-1 px-4 py-8 sm:max-w-lg sm:px-6 sm:py-10 md:max-w-xl lg:max-w-2xl">
          <Routes>
            <Route path="/" element={<OcrScanner />} />
            <Route path="/expenses" element={<Expenses />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
