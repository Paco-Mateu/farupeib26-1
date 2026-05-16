'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  FileText,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const navMain = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/pro' },
  { icon: Users, label: 'Users', href: '/pro/users' },
  { icon: BarChart3, label: 'Analytics', href: '/pro/analytics' },
  { icon: FileText, label: 'Reports', href: '/pro/reports', badge: '3' },
]

const navSystem = [
  { icon: Zap, label: 'Automation', href: '/pro/automation' },
  { icon: Settings, label: 'Settings', href: '/pro/settings' },
]

export function ProSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full border-r bg-background">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b shrink-0">
        <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
          <Zap className="w-4 h-4 text-background" />
        </div>
        <span className="font-semibold tracking-tight text-sm">ProPortal</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <NavSection label="Workspace" items={navMain} pathname={pathname} />
        <Separator className="my-3" />
        <NavSection label="System" items={navSystem} pathname={pathname} />
      </nav>

      {/* User */}
      <div className="p-3 border-t shrink-0">
        <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors group text-left">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs font-medium">P</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none truncate">Professional User</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">Administrator</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      </div>
    </aside>
  )
}

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string
  items: typeof navMain
  pathname: string
}) {
  return (
    <div>
      <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      {items.map(({ icon: Icon, label, href, badge }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              active
                ? 'bg-foreground text-background font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && (
              <Badge
                variant={active ? 'outline' : 'secondary'}
                className="text-xs h-5 px-1.5"
              >
                {badge}
              </Badge>
            )}
          </Link>
        )
      })}
    </div>
  )
}
