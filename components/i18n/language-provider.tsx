'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  translations,
  type Language,
} from '@/lib/i18n'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  copy: (typeof translations)[Language]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  const fromQuery = normalizeLanguage(new URLSearchParams(window.location.search).get('lang'))
  const rawQuery = new URLSearchParams(window.location.search).get('lang')
  if (rawQuery) return fromQuery

  const fromStorage = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
  const rawStorage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (rawStorage) return fromStorage

  const browserLanguage = window.navigator.languages?.[0] || window.navigator.language
  return normalizeLanguage(browserLanguage)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const nextLanguage = detectInitialLanguage()
    setLanguage(nextLanguage)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language

    const url = new URL(window.location.href)
    url.searchParams.set('lang', language)
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [language, mounted])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      copy: translations[language],
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return context
}

export { LANGUAGE_OPTIONS }
