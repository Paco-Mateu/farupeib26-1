'use client'

import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function WorkspaceLoadingState({
  title = 'Cargando datos…',
  detail,
}: {
  title?: string
  detail?: string
}) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center px-6 py-10">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2a9e90]/10 text-[#2a9e90]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-[#152520]">{title}</p>
        {detail ? <p className="mt-1 text-sm text-[#4a7068]">{detail}</p> : null}
      </div>
    </div>
  )
}

export function WorkspaceErrorState({
  title = 'No se han podido cargar los datos.',
  detail,
  actionLabel = 'Reintentar',
  onRetry,
}: {
  title?: string
  detail?: string
  actionLabel?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center px-6 py-10">
      <div className="flex max-w-md flex-col items-center rounded-3xl border border-red-100 bg-white px-8 py-8 text-center shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-[#152520]">{title}</p>
        {detail ? <p className="mt-1 text-sm text-[#4a7068]">{detail}</p> : null}
        {onRetry ? (
          <Button
            size="sm"
            variant="outline"
            className="mt-4 gap-1.5 rounded-xl text-xs"
            onClick={onRetry}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function WorkspaceEmptyState({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string
  detail: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center px-6 py-10">
      <div className="flex max-w-md flex-col items-center rounded-3xl border border-slate-100 bg-white px-8 py-8 text-center shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Inbox className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-[#152520]">{title}</p>
        <p className="mt-1 text-sm text-[#4a7068]">{detail}</p>
        {actionLabel && onAction ? (
          <Button
            size="sm"
            className="mt-4 rounded-xl bg-[#2a9e90] text-xs text-white hover:bg-[#3ab5a8]"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
