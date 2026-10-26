'use client'

import { useCallback } from 'react'

import { useLanguage } from '@/components/i18n/language-provider'
import { getXarxaStrings } from '@/lib/i18n/xarxa'

/**
 * Translate Xarxa workspace copy for the active language.
 *
 * const t = useXarxaT('casos-pkpd')
 * t('queue.title')
 *
 * Unknown keys return the key itself so a missed entry is loud, not blank.
 */
export function useXarxaT(namespace: string): (key: string) => string {
  const { language } = useLanguage()

  const t = useCallback(
    (key: string) => getXarxaStrings(namespace, language)[key] ?? key,
    [namespace, language],
  )

  return t
}
