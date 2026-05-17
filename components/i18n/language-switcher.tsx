'use client'

import { cn } from '@/lib/utils'
import { LANGUAGE_OPTIONS, useLanguage } from '@/components/i18n/language-provider'

export function LanguageSwitcher({
  theme = 'light',
  compact = false,
}: {
  theme?: 'light' | 'dark'
  compact?: boolean
}) {
  const { language, setLanguage } = useLanguage()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full p-1',
        theme === 'dark' ? 'bg-white/10' : 'bg-black/5',
      )}
      aria-label="Language switcher"
    >
      {LANGUAGE_OPTIONS.map((item) => {
        const active = item.code === language
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code)}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition',
              compact ? 'min-w-[40px]' : 'min-w-[52px]',
              theme === 'dark'
                ? active
                  ? 'bg-white text-[#0f1d1c]'
                  : 'text-white/75 hover:bg-white/10'
                : active
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-600 hover:bg-black/5',
            )}
            title={item.label}
          >
            {item.shortLabel}
          </button>
        )
      })}
    </div>
  )
}
