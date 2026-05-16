import { ProSidebar } from '@/components/pro/sidebar'

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ProSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-screen-xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
