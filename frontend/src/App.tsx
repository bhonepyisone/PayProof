import { BrowserRouter, Routes, Route } from 'react-router-dom'
import OcrScanner from './pages/OcrScanner'
import Expenses from './pages/Expenses'

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <div className="mx-auto w-full max-w-full px-4 py-10 sm:max-w-lg sm:px-6 sm:py-14 md:max-w-xl lg:max-w-2xl lg:py-20">
          {/* Header — visible on all pages */}
          <header className="mb-6 text-center sm:mb-10">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e96ff]/[0.12] sm:mb-5 sm:h-12 sm:w-12">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="12" rx="2" stroke="#2e96ff" strokeWidth="1.5" />
                <path d="M7 10h4M7 14h2" stroke="#2e96ff" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="15.5" cy="10.5" r="2" stroke="#2e96ff" strokeWidth="1.5" />
              </svg>
            </div>
            <h1 className="text-[22px] font-medium tracking-tight text-[#ffffff] sm:text-[28px]">
              PayProof
            </h1>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#b2bbc5] sm:mt-2 sm:text-[15px]">
              OCR Payment Proof Connector
            </p>
            <p className="mt-2.5 inline-flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-[#8e959f] sm:mt-3 sm:gap-2 sm:text-[12px]">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#81c995]" />
                On-device
              </span>
              <span className="text-[#3a3b40]">·</span>
              <span>Privacy-first</span>
              <span className="text-[#3a3b40]">·</span>
              <span>KBZ Pay</span>
            </p>
          </header>

          {/* Routes */}
          <Routes>
            <Route path="/" element={<OcrScanner />} />
            <Route path="/expenses" element={<Expenses />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
