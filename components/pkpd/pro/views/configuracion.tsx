'use client'

import { Bell, Globe, Lock, Shield } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

type Section = { id: string; label: string; icon: React.ElementType }

const SECTIONS: Section[] = [
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'seguridad', label: 'Seguridad y acceso', icon: Shield },
  { id: 'privacidad', label: 'Privacidad y datos', icon: Lock },
  { id: 'integraciones', label: 'Integraciones', icon: Globe },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-[#8dc63f]' : 'bg-slate-200'}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function Configuracion() {
  const [active, setActive] = useState('notificaciones')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifCaso, setNotifCaso] = useState(true)
  const [notifSesion, setNotifSesion] = useState(false)
  const [notifAgent, setNotifAgent] = useState(true)

  return (
    <div className="flex h-full overflow-hidden">
      {/* section list */}
      <div className="w-56 shrink-0 border-r border-slate-100 bg-white px-2 py-4">
        <ul className="space-y-0.5">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => setActive(id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                  active === id
                    ? 'bg-[#8dc63f]/[0.08] font-medium text-[#152520]'
                    : 'text-[#4a7068] hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${active === id ? 'text-[#8dc63f]' : 'text-[#4a7068]'}`} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {active === 'notificaciones' && (
          <div className="max-w-lg">
            <h2 className="mb-1 text-sm font-semibold text-[#152520]">Notificaciones</h2>
            <p className="mb-6 text-xs text-[#4a7068]">Configura qué notificaciones quieres recibir y por qué canal.</p>
            <div className="space-y-4">
              {[
                { label: 'Notificaciones por correo', sub: 'Recibe un resumen diario en tu correo', val: notifEmail, set: setNotifEmail },
                { label: 'Nuevos casos asignados', sub: 'Aviso cuando un caso nuevo te es asignado', val: notifCaso, set: setNotifCaso },
                { label: 'Recordatorios de sesión', sub: 'Aviso 30 min antes de cada sesión de red', val: notifSesion, set: setNotifSesion },
                { label: 'Actividad de agentes IA', sub: 'Notificación cuando un agente completa una tarea', val: notifAgent, set: setNotifAgent },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-[#152520]">{item.label}</p>
                    <p className="text-xs text-[#4a7068]">{item.sub}</p>
                  </div>
                  <Toggle checked={item.val} onChange={item.set} />
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button size="sm" className="rounded-xl bg-[#8dc63f] text-xs text-white hover:bg-[#9fd44e]">
                Guardar cambios
              </Button>
            </div>
          </div>
        )}

        {active === 'seguridad' && (
          <div className="max-w-lg">
            <h2 className="mb-1 text-sm font-semibold text-[#152520]">Seguridad y acceso</h2>
            <p className="mb-6 text-xs text-[#4a7068]">Gestiona el acceso, contraseñas y autenticación de tu cuenta.</p>
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-sm font-medium text-[#152520]">Autenticación de dos factores</p>
                <p className="mt-0.5 text-xs text-[#4a7068]">Estado: <span className="font-semibold text-teal-600">Activada</span></p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-sm font-medium text-[#152520]">Última sesión</p>
                <p className="mt-0.5 text-xs text-[#4a7068]">Hoy a las 08:30 · Barcelona, España</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl text-xs">
                Cambiar contraseña
              </Button>
            </div>
          </div>
        )}

        {active === 'privacidad' && (
          <div className="max-w-lg">
            <h2 className="mb-1 text-sm font-semibold text-[#152520]">Privacidad y datos</h2>
            <p className="mb-6 text-xs text-[#4a7068]">Controla cómo se usan tus datos y los de los pacientes.</p>
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <p className="text-xs text-[#4a7068] leading-6">
                Todos los datos de pacientes están seudonimizados según la normativa RGPD. Los datos clínicos no se usan para entrenar modelos sin consentimiento explícito.
              </p>
              <Button size="sm" variant="outline" className="mt-3 rounded-xl text-xs">
                Ver política completa
              </Button>
            </div>
          </div>
        )}

        {active === 'integraciones' && (
          <div className="max-w-lg">
            <h2 className="mb-1 text-sm font-semibold text-[#152520]">Integraciones</h2>
            <p className="mb-6 text-xs text-[#4a7068]">Conexiones con sistemas hospitalarios y externos.</p>
            <div className="space-y-3">
              {[
                { name: 'Historia Clínica Electrónica (HCE)', status: 'Conectado', cls: 'text-teal-600' },
                { name: 'Laboratorio LIS', status: 'Pendiente configuración', cls: 'text-amber-600' },
                { name: 'Correo corporativo', status: 'Conectado', cls: 'text-teal-600' },
              ].map((intg) => (
                <div key={intg.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-[#152520]">{intg.name}</p>
                    <p className={`text-xs font-medium ${intg.cls}`}>{intg.status}</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs">Configurar</Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
