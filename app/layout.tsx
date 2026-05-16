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

export const metadata = {
  title: 'Prototype Sprint Kit',
  description: 'A rapid prototype workspace for Next.js, FastAPI, MongoDB, and OpenAI.',
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
