import { Suspense } from 'react'

import { DemoIntro } from '@/components/pkpd/pro/demo-intro'
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7faf9] text-sm text-[#4a7068]">
          Cargando espacio de trabajo…
        </div>
      }
    >
      <XarraPro />
    </Suspense>
  )
}
