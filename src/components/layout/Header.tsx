'use client'

import { usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/agenda':         'Agenda del Día',
  '/cobrar':         'Cobrar',
  '/citas/nueva':    'Nueva Cita',
  '/clientes':       'Clientes',
  '/inventario':     'Inventario',
  '/servicios':      'Servicios',
  '/configuracion':  'Configuración',
}

export function Header() {
  const pathname = usePathname()
  const title    = PAGE_TITLES[pathname] ?? PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k)) ?? ''] ?? 'BarberíaApp'
  const today    = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays size={15} />
        <span className="capitalize">{today}</span>
      </div>
    </header>
  )
}
