'use client'

import Image from 'next/image'

// Static avatar map for names that come from the API without avatarUrl
// (e.g. requesterName strings on cases, session participants)
const AVATAR_BY_NAME: Record<string, string> = {
  'Dra. Laura Vidal':    '/avatars/laura-vidal.jpg',
  'Dr. Marcos Ortega':   '/avatars/marcos-ortega.jpg',
  'Dra. Ana Beltrán':    '/avatars/ana-beltran.jpg',
  'Dr. Javier Soler':    '/avatars/javier-soler.jpg',
  'Dra. Marta Iglesias': '/avatars/marta-iglesias.jpg',
  'Enf. Clara Moreno':   '/avatars/clara-moreno.jpg',
  'Enf. Nuria Campos':   '/avatars/nuria-campos.jpg',
  'Dra. Elena Ruiz':     '/avatars/elena-ruiz.jpg',
  'Dr. Víctor Molina':   '/avatars/victor-molina.jpg',
  'Dra. Silvia Romero':  '/avatars/silvia-romero.jpg',
  'Dr. Carlos Medina':   '/avatars/carlos-medina.jpg',
  'Sra. Patricia León':  '/avatars/patricia-leon.jpg',
  'Farmacéutico referente': '/avatars/farmaceutico-referente.jpg',
  'Farmacia referente':     '/avatars/farmaceutico-referente.jpg',
}

function initials(name: string) {
  return name
    .replace(/^(Dr\.|Dra\.|Enf\.|Sra\.|Sr\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const SIZE_CLS: Record<string, string> = {
  xs:  'h-5 w-5 text-[8px]',
  sm:  'h-7 w-7 text-[10px]',
  md:  'h-9 w-9 text-xs',
  lg:  'h-11 w-11 text-sm',
  xl:  'h-14 w-14 text-base',
}

const SIZE_PX: Record<string, number> = {
  xs: 20, sm: 28, md: 36, lg: 44, xl: 56,
}

type Props = {
  name: string
  avatarUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function PersonAvatar({ name, avatarUrl, size = 'sm', className = '' }: Props) {
  const src = avatarUrl ?? AVATAR_BY_NAME[name]
  const px = SIZE_PX[size] ?? 28
  const sizeCls = SIZE_CLS[size] ?? SIZE_CLS.sm

  if (src) {
    return (
      <div className={`shrink-0 overflow-hidden rounded-full ${sizeCls} ${className}`}>
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-full bg-[#7b3fa0]/15 font-semibold text-[#7b3fa0] ${sizeCls} ${className}`}
      title={name}
    >
      {initials(name)}
    </div>
  )
}

// Inline name + avatar pill — drop-in for plain text name displays
export function PersonChip({
  name,
  avatarUrl,
  size = 'xs',
  className = '',
}: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <PersonAvatar name={name} avatarUrl={avatarUrl} size={size} />
      <span>{name}</span>
    </span>
  )
}
