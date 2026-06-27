import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  Dumbbell,
  Repeat2,
  BarChart2,
  Sparkles,
  Users,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/habits', icon: Dumbbell, label: 'Habits' },
  { to: '/routines', icon: Repeat2, label: 'Routines' },
  { to: '/progress', icon: BarChart2, label: 'Progress' },
  { to: '/coach', icon: Sparkles, label: 'AI Coach' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function NavItem({ to, icon: Icon, label }: (typeof navItems)[0]) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] text-[var(--text-sm)] font-medium transition-colors',
          'hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]',
          isActive
            ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
            : 'text-[var(--text-muted)]',
        )
      }
    >
      <Icon size={18} aria-hidden />
      <span>{label}</span>
    </NavLink>
  )
}

/** Sidebar for desktop (≥1024px) */
export function Sidebar() {
  return (
    <nav
      aria-label="Main navigation"
      className="hidden lg:flex flex-col w-56 shrink-0 border-r border-[var(--border)] h-dvh sticky top-0 p-4 gap-1"
    >
      <div className="px-3 py-2 mb-4">
        <span className="text-[var(--text-xl)] font-bold text-[var(--accent)]">ChangeOS</span>
      </div>
      {navItems.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
    </nav>
  )
}

/** Bottom tab bar for mobile/tablet (< 1024px) */
export function BottomNav() {
  // Bottom nav: the 5 core routes users need daily
  const mobileItems = [navItems[0], navItems[1], navItems[2], navItems[4], navItems[7]]
  return (
    <nav
      aria-label="Main navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]"
    >
      <ul className="flex" role="list">
        {mobileItems.map(({ to, icon: Icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] w-full text-[var(--text-xs)] transition-colors',
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                )
              }
            >
              <Icon size={20} aria-hidden />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
