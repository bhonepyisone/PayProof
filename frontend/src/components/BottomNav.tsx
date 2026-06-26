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
              aria-label={tab.label}
              className={`flex flex-col items-center gap-1 px-4 py-2 min-h-[44px] min-w-[44px] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2e96ff] focus:ring-offset-2 focus:ring-offset-[#1a1b1f] rounded-md ${
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
