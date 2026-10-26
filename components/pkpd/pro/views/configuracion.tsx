'use client'

import { Bell, Globe, Lock, Shield } from 'lucide-react'
import { useState } from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import { Button } from '@/components/ui/button'

type Section = { id: string; labelKey: string; icon: React.ElementType }

const SECTIONS: Section[] = [
  { id: 'notificaciones', labelKey: 'section.notificaciones', icon: Bell },
  { id: 'seguridad', labelKey: 'section.seguridad', icon: Shield },
  { id: 'privacidad', labelKey: 'section.privacidad', icon: Lock },
  { id: 'integraciones', labelKey: 'section.integraciones', icon: Globe },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-[#7b3fa0]' : 'bg-slate-200'}`}
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
  const t = useXarxaT('configuracion')
  const [active, setActive] = useState('notificaciones')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifCaso, setNotifCaso] = useState(true)
  const [notifSesion, setNotifSesion] = useState(false)
  const [notifAgent, setNotifAgent] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  function showPreview(message: string) {
    setNotice(message)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* section list */}
      <div className="w-56 shrink-0 border-r border-slate-100 bg-white px-2 py-4">
        <ul className="space-y-0.5">
          {SECTIONS.map(({ id, labelKey, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => setActive(id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                  active === id
                    ? 'bg-[#7b3fa0]/[0.08] font-medium text-[#152520]'
                    : 'text-[#4a7068] hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${active === id ? 'text-[#7b3fa0]' : 'text-[#4a7068]'}`} />
                {t(labelKey)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {notice ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {notice}
          </div>
        ) : null}
        {active === 'notificaciones' && (
          <div className="max-w-lg">
            <h2 className="mb-1 text-sm font-semibold text-[#152520]">{t('notif.title')}</h2>
            <p className="mb-6 text-xs text-[#4a7068]">{t('notif.subtitle')}</p>
            <div className="space-y-4">
              {[
                { label: t('notif.email.label'), sub: t('notif.email.sub'), val: notifEmail, set: setNotifEmail },
                { label: t('notif.caso.label'), sub: t('notif.caso.sub'), val: notifCaso, set: setNotifCaso },
                { label: t('notif.sesion.label'), sub: t('notif.sesion.sub'), val: notifSesion, set: setNotifSesion },
                { label: t('notif.agent.label'), sub: t('notif.agent.sub'), val: notifAgent, set: setNotifAgent },
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
              <Button
                size="sm"
                className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
                onClick={() => showPreview(t('notif.save.preview'))}
              >
                {t('notif.save')}
              </Button>
            </div>
          </div>
        )}

        {active === 'seguridad' && (
          <div className="max-w-lg">
            <h2 className="mb-1 text-sm font-semibold text-[#152520]">{t('seg.title')}</h2>
            <p className="mb-6 text-xs text-[#4a7068]">{t('seg.subtitle')}</p>
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-sm font-medium text-[#152520]">{t('seg.2fa')}</p>
                <p className="mt-0.5 text-xs text-[#4a7068]">{t('seg.estado')}<span className="font-semibold text-teal-600">{t('seg.activada')}</span></p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-sm font-medium text-[#152520]">{t('seg.ultima')}</p>
                <p className="mt-0.5 text-xs text-[#4a7068]">{t('seg.ultima.valor')}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => showPreview(t('seg.cambiar.preview'))}
              >
                {t('seg.cambiar')}
              </Button>
            </div>
          </div>
        )}

        {active === 'privacidad' && (
          <div className="max-w-lg">
            <h2 className="mb-1 text-sm font-semibold text-[#152520]">{t('priv.title')}</h2>
            <p className="mb-6 text-xs text-[#4a7068]">{t('priv.subtitle')}</p>
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <p className="text-xs text-[#4a7068] leading-6">{t('priv.rgpd')}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 rounded-xl text-xs"
                onClick={() => showPreview(t('priv.politica.preview'))}
              >
                {t('priv.politica')}
              </Button>
            </div>
          </div>
        )}

        {active === 'integraciones' && (
          <div className="max-w-lg">
            <h2 className="mb-1 text-sm font-semibold text-[#152520]">{t('int.title')}</h2>
            <p className="mb-6 text-xs text-[#4a7068]">{t('int.subtitle')}</p>
            <div className="space-y-3">
              {[
                { name: t('int.hce'), status: t('int.conectado'), cls: 'text-teal-600' },
                { name: t('int.lis'), status: t('int.pendiente'), cls: 'text-amber-600' },
                { name: t('int.correo'), status: t('int.conectado'), cls: 'text-teal-600' },
              ].map((intg) => (
                <div key={intg.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-[#152520]">{intg.name}</p>
                    <p className={`text-xs font-medium ${intg.cls}`}>{intg.status}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs"
                    onClick={() => showPreview(t('int.configurar.preview').replaceAll('{name}', intg.name))}
                  >
                    {t('int.configurar')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
