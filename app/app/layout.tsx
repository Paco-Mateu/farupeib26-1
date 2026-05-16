import { MobileHeader } from '@/components/app/mobile-header'
import { BottomNav } from '@/components/app/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden bg-background"
      style={{ height: '100dvh' }}
    >
      <MobileHeader />
      <main className="flex-1 overflow-y-auto overscroll-none">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
