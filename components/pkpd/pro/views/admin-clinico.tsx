'use client'

import { ShieldCheck } from 'lucide-react'

export function AdminClinico() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#7b3fa0]" />
          <div>
            <h2 className="text-sm font-semibold text-[#152520]">Admin clínico</h2>
            <p className="text-xs text-[#4a7068]">Validaciones y supervisión del programa Crohn PK/PD.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7b3fa0]/10">
            <ShieldCheck className="h-6 w-6 text-[#7b3fa0]" />
          </div>
          <p className="text-sm font-medium text-[#152520]">Panel de administración clínica</p>
          <p className="mt-1 text-xs text-[#4a7068]">Módulo en desarrollo — disponible próximamente.</p>
        </div>
      </div>
    </div>
  )
}
