'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/AuthProvider'
import { useBarberia } from '@/hooks/useBarberia'
import {
  CalendarDays, CreditCard, Users, Package,
  Scissors, LayoutDashboard, LogOut, Settings, Store, UserRound,
} from 'lucide-react'

const navItems = [
  { href: '/agenda',      label: 'Agenda del Día', icon: CalendarDays },
  { href: '/cobrar',      label: 'Cobrar',          icon: CreditCard   },
  { href: '/citas/nueva', label: 'Nueva Cita',      icon: LayoutDashboard },
  { href: '/clientes',    label: 'Clientes',        icon: Users        },
  { href: '/barberos',    label: 'Barberos',         icon: UserRound    },
  { href: '/inventario',  label: 'Inventario',      icon: Package      },
  { href: '/servicios',   label: 'Servicios',       icon: Scissors     },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { data: barberia } = useBarberia()

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r bg-card min-h-screen shadow-sm">
      {/* Logo + nombre barbería */}
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <div className="w-9 h-9 rounded-xl overflow-hidden border border-border bg-muted/50 shrink-0 flex items-center justify-center">
          {barberia?.logoUrl ? (
            <Image
              src={barberia.logoUrl}
              alt={barberia.nombre}
              width={36}
              height={36}
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <Store size={18} className="text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-none truncate max-w-[140px]">
            {barberia?.nombre ?? 'BarberíaApp'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px]">
            {user?.nombre ?? '—'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const Icon   = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn('sidebar-link', active && 'active')}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: config + user + logout */}
      <div className="px-3 py-4 border-t space-y-1">
        <Link
          href="/configuracion"
          prefetch={false}
          className={cn('sidebar-link', pathname.startsWith('/configuracion') && 'active')}
        >
          <Settings size={18} />
          Configuración
        </Link>

        <div className="px-3 py-2">
          <p className="text-xs font-medium truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground">{user?.rol === 'ADMIN' ? 'Administrador' : 'Barbero'}</p>
        </div>

        <button
          onClick={logout}
          className="sidebar-link w-full text-left text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
