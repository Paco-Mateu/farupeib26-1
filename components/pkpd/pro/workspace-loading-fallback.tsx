'use client'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'

export function WorkspaceLoadingFallback() {
  const t = useXarxaT('workspace-state')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7faf9] text-sm text-[#4a7068]">
      {t('loading.workspace')}
    </div>
  )
}
