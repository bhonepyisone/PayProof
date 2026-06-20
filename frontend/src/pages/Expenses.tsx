// ── Expenses Page ──────────────────────────────────────────────────────────
// Placeholder — full implementation in a future prompt.

export default function Expenses() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Empty-state icon */}
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2e96ff]/[0.12]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="#2e96ff" strokeWidth="1.5" />
          <path d="M3 9h18" stroke="#2e96ff" strokeWidth="1.5" />
          <path d="M9 4v5" stroke="#2e96ff" strokeWidth="1.5" />
        </svg>
      </div>

      <h2 className="text-[20px] font-medium text-[#ffffff] sm:text-[24px]">
        Expenses
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#b2bbc5] sm:text-[15px]">
        Track and manage your expenses
      </p>
      <div className="mt-8 rounded-lg border border-dashed border-[#3a3b40] bg-[#1a1b1f] px-6 py-10 text-center sm:px-12">
        <p className="text-[13px] text-[#8e959f] sm:text-[14px]">
          No expenses yet. Add your first expense to get started.
        </p>
      </div>
    </div>
  )
}
