import { Bell, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function MobileHeader() {
  return (
    <header
      className="shrink-0 flex items-center justify-between px-4 border-b bg-background/95 backdrop-blur-sm"
      style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}
    >
      <Avatar className="w-8 h-8">
        <AvatarFallback className="text-xs font-semibold">U</AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative w-9 h-9">
          <Bell className="w-4 h-4" />
          <Badge className="absolute -top-0.5 -right-0.5 w-4 h-4 p-0 flex items-center justify-center text-[10px]">
            2
          </Badge>
        </Button>
      </div>
    </header>
  )
}
