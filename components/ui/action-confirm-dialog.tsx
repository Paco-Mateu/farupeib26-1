'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Tone = 'danger' | 'warning' | 'default'

const TONE_STYLES: Record<Tone, { ring: string; bg: string; text: string; button: string }> = {
  danger: {
    ring: 'ring-red-200',
    bg: 'bg-red-50',
    text: 'text-red-700',
    button: 'bg-red-600 text-white hover:bg-red-700',
  },
  warning: {
    ring: 'ring-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    button: 'bg-amber-600 text-white hover:bg-amber-700',
  },
  default: {
    ring: 'ring-slate-200',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    button: 'bg-[#7b3fa0] text-white hover:bg-[#6a3490]',
  },
}

export function ActionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  icon,
  confirmBusy = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: Tone
  icon?: React.ReactNode
  confirmBusy?: boolean
  onConfirm: () => void
}) {
  const style = TONE_STYLES[tone]

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[2px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup
          className={cn(
            'fixed z-[100] w-full overflow-hidden border border-slate-200 bg-white shadow-2xl transition duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0',
            'inset-x-0 bottom-0 rounded-t-[28px] data-ending-style:translate-y-[2rem] data-starting-style:translate-y-[2rem]',
            'md:left-1/2 md:top-1/2 md:max-w-[460px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px] md:data-ending-style:translate-y-[-40%] md:data-starting-style:translate-y-[-40%]'
          )}
        >
          <div className="p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1', style.bg, style.ring)}>
                <div className={style.text}>{icon ?? <AlertTriangle className="h-5 w-5" />}</div>
              </div>
              <div className="min-w-0">
                <DialogPrimitive.Title className="text-lg font-semibold text-[#152520]">
                  {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-[#4a7068]">
                  {description}
                </DialogPrimitive.Description>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 md:flex-row md:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => onOpenChange(false)}
              disabled={confirmBusy}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              className={cn('rounded-2xl', style.button)}
              onClick={onConfirm}
              disabled={confirmBusy}
            >
              {confirmBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
