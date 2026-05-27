'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, User, Phone, Mail, TrendingUp } from 'lucide-react'
import { useClients }      from '@/hooks/useClients'
import { Input }           from '@/components/ui/input'
import { Badge }           from '@/components/ui/badge'
import { Skeleton }        from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ClientesPage() {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)

  const { data, isLoading } = useClients({ q: search, page, limit: 20 })
  const clientes = data?.data ?? []
  const total    = data?.total ?? 0

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Total clientes</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, cédula, teléfono..."
          className="pl-9"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden divide-y">
          {clientes.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              {search ? 'No se encontraron clientes con esa búsqueda' : 'Aún no hay clientes registrados'}
            </div>
          )}
          {clientes.map(c => (
            <Link key={c.id} href={`/clientes/${c.id}`}>
              <div className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors cursor-pointer">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.nombre}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User size={11} /> {c.cedula}
                    </span>
                    {c.telefono && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone size={11} /> {c.telefono}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-primary">{formatCurrency(c.totalGastado)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.totalVisitas} visita{c.totalVisitas !== 1 ? 's' : ''}
                  </p>
                </div>

                {c.totalVisitas >= 10 && (
                  <Badge variant="warning" className="shrink-0">
                    <TrendingUp size={10} className="mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-secondary"
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-secondary"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
