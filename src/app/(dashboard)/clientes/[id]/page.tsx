'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useClient } from '@/hooks/useClients'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
import { formatCurrency, formatDateTime, formatDate, ESTADO_CITA_LABELS, ESTADO_CITA_COLORS, cn } from '@/lib/utils'
import { Phone, Mail, FileText, ArrowLeft, Calendar, TrendingUp, CreditCard } from 'lucide-react'

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: cliente, isLoading } = useClient(id)

  if (isLoading) return (
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
  if (!cliente) return <p className="text-muted-foreground">Cliente no encontrado</p>

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/clientes">
        <Button variant="ghost" size="sm">
          <ArrowLeft size={15} className="mr-1.5" />
          Volver
        </Button>
      </Link>

      {/* Profile card */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold">{cliente.nombre}</h2>
            <p className="text-sm text-muted-foreground">CC {cliente.cedula}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {cliente.telefono && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone size={13} /> {cliente.telefono}
                </span>
              )}
              {cliente.email && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail size={13} /> {cliente.email}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar size={13} /> Desde {formatDate(cliente.fechaRegistro ?? cliente.createdAt)}
              </span>
            </div>
            {cliente.notasEstilo && (
              <div className="mt-3 rounded-lg bg-secondary/30 px-3 py-2 flex items-start gap-2">
                <FileText size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{cliente.notasEstilo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{cliente.totalVisitas}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Visitas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{formatCurrency(cliente.totalGastado)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total gastado</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">
              {cliente.ultimaVisita ? formatDate(cliente.ultimaVisita) : 'Nunca'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Último servicio</p>
          </div>
        </div>
      </div>

      {/* Appointment history */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <Calendar size={16} className="text-muted-foreground" />
          <h3 className="font-semibold">Historial de citas</h3>
        </div>
        <div className="divide-y">
          {(cliente as any).citas?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin citas registradas</p>
          )}
          {((cliente as any).citas ?? []).map((cita: any) => (
            <div key={cita.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{cita.servicios?.[0]?.servicio?.nombre ?? cita.servicios?.map((s: any) => s.servicio?.nombre).join(', ')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDateTime(cita.fechaHora)} · {cita.barbero?.nombre}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cita.precioEstimado && (
                  <span className="text-sm font-semibold">{formatCurrency(Number(cita.precioEstimado))}</span>
                )}
                <Badge className={cn('badge-estado', ESTADO_CITA_COLORS[cita.estado])}>
                  {ESTADO_CITA_LABELS[cita.estado]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales history */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <CreditCard size={16} className="text-muted-foreground" />
          <h3 className="font-semibold">Historial de ventas</h3>
        </div>
        <div className="divide-y">
          {((cliente as any).ventas ?? []).map((venta: any) => (
            <div key={venta.id} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{formatDateTime(venta.fecha)}</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(venta.total)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {venta.items?.map((i: any) => `${i.cantidad}x ${i.descripcion}`).join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
