import './globals.css'
import { Merriweather } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Viewport } from 'next'

const merriweather = Merriweather({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '700'],
})

export function generateMetadata() {
  const title = process.env.PROJECT_NAME ?? process.env.APP_NAME ?? 'Prototype Sprint Kit'
  return {
    title,
    description: `${title} — built on Next.js, FastAPI, and MongoDB.`,
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', GeistSans.variable)}>
      <body className={`${GeistSans.variable} ${merriweather.variable}`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
