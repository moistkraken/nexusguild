import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const ITEMS = [
  { to: '/', label: 'HOME', icon: '⌂' },
  { to: '/progress', label: 'DATA', icon: '▲' },
  { to: '/history', label: 'LOG', icon: '≡' },
  { to: '/settings', label: 'SYS', icon: '⚙' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-void/95 border-t border-cyan/20 backdrop-blur-md">
      <div className="max-w-lg mx-auto grid grid-cols-4">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-0.5 py-2.5 font-display text-[10px] tracking-widest transition-colors',
                isActive ? 'text-cyan' : 'text-ink-dimmer hover:text-ink-dim',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={clsx('text-base leading-none', isActive && 'text-glow-cyan')}>{item.icon}</span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
