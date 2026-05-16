'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Search, Compass, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { icon: Home, label: 'Home', href: '/app' },
  { icon: Search, label: 'Search', href: '/app/search' },
  { icon: Compass, label: 'Explore', href: '/app/explore' },
  { icon: Bell, label: 'Activity', href: '/app/activity' },
  { icon: User, label: 'Profile', href: '/app/profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="shrink-0 flex items-center border-t bg-background/95 backdrop-blur-sm px-2"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      {tabs.map(({ icon: Icon, label, href }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 relative"
          >
            {active && (
              <motion.div
                layoutId="bottom-tab-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-foreground"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <Icon
              className={cn(
                'w-5 h-5 transition-colors duration-150',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
              strokeWidth={active ? 2.5 : 1.5}
            />
            <span
              className={cn(
                'text-[10px] font-medium transition-colors duration-150 leading-none',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
