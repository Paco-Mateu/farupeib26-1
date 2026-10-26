import { Suspense } from 'react'

import { DemoIntro } from '@/components/pkpd/pro/demo-intro'
import { WorkspaceLoadingFallback } from '@/components/pkpd/pro/workspace-loading-fallback'
import { XarraPro } from '@/components/pkpd/pro/xarxa-pro'

export default function Home({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const params = searchParams ?? {}
  const shouldOpenWorkspace =
    typeof params.vista === 'string' ||
    typeof params.caseId === 'string' ||
    typeof params.programa === 'string'

  if (!shouldOpenWorkspace) {
    return <DemoIntro />
  }

  return (
    <Suspense fallback={<WorkspaceLoadingFallback />}>
      <XarraPro />
    </Suspense>
  )
}
