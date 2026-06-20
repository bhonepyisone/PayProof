import { useLocation, Link } from 'react-router-dom'

// ── Types ──────────────────────────────────────────────────────────────────
interface SidebarProps {
  expanded: boolean
  onToggle: () => void
  isMobile: boolean
}

// ── Navigation items ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'OCR Scanner',
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
    label: 'Achievements',
    path: '/achievements',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.3L10 14.5 5.1 17l.9-5.3-4-3.9L7.5 7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
]

// ── Sidebar ────────────────────────────────────────────────────────────────
export default function Sidebar({ expanded, onToggle, isMobile }: SidebarProps) {
  const location = useLocation()

  const sidebarContent = (
    <div
      className={`flex h-full flex-col bg-[#1a1b1f] transition-all duration-300 ease-in-out ${
        expanded ? 'w-[240px]' : 'w-[64px]'
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b border-[#3a3b40] px-4">
        <button
          onClick={onToggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#b2bbc5] hover:bg-[#2a2b30] hover:text-[#ffffff] transition-colors"
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
        {expanded && (
          <span className="text-[15px] font-medium text-[#ffffff] truncate">PayProof</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={isMobile ? onToggle : undefined}
              className={`mx-2 mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                isActive
                  ? 'border-l-[3px] border-[#2e96ff] bg-[#2e96ff]/[0.1] text-[#2e96ff]'
                  : 'border-l-[3px] border-transparent text-[#b2bbc5] hover:bg-[#2a2b30] hover:text-[#ffffff]'
              } ${!expanded ? 'justify-center' : ''}`}
              title={!expanded ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {expanded && (
                <span className="text-[14px] font-medium truncate">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  // Mobile: overlay drawer
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {expanded && (
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
            onClick={onToggle}
          />
        )}
        {/* Drawer */}
        <div
          className={`fixed left-0 top-0 z-50 h-full transition-transform duration-300 ease-in-out ${
            expanded ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </>
    )
  }

  // Desktop: fixed sidebar
  return (
    <div className="sticky top-0 h-screen shrink-0">
      {sidebarContent}
    </div>
  )
}
