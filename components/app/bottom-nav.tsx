'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Home, Search, Compass, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { icon: Home, label: 'Home', href: '#home' },
  { icon: Search, label: 'Search', href: '#search' },
  { icon: Compass, label: 'Explore', href: '#explore' },
  { icon: Bell, label: 'Activity', href: '#activity' },
  { icon: User, label: 'Profile', href: '#profile' },
]

export function BottomNav() {
  const [activeHash, setActiveHash] = useState<string>('#home')

  useEffect(() => {
    const updateHash = () => {
      const nextHash = window.location.hash || '#home'
      setActiveHash(nextHash)
    }

    updateHash()
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  return (
    <nav
      className="shrink-0 flex items-center border-t bg-background/95 backdrop-blur-sm px-2"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      {tabs.map(({ icon: Icon, label, href }) => {
        const active = activeHash === href
        return (
          <a
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 relative"
          >
            {active && (
              <motion.div
                layoutId="bottom-tab-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-teal"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <Icon
              className={cn(
                'w-5 h-5 transition-colors duration-150',
                active ? 'text-teal' : 'text-muted-foreground',
              )}
              strokeWidth={active ? 2.5 : 1.5}
            />
            <span
              className={cn(
                'text-[10px] font-medium transition-colors duration-150 leading-none',
                active ? 'text-teal' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </a>
        )
      })}
    </nav>
  )
}
