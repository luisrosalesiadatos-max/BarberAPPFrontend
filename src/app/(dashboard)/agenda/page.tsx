'use client'

import { useState } from 'react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react'
import Link from 'next/link'
import { useAppointments } from '@/hooks/useAppointments'
import { useBarbers }      from '@/hooks/useBarbers'
import { Skeleton }        from '@/components/ui/skeleton'
import { Button }          from '@/components/ui/button'
import { Badge }           from '@/components/ui/badge'
import { cn, formatTime, ESTADO_CITA_LABELS, ESTADO_CITA_COLORS } from '@/lib/utils'
import type { Cita, Barbero } from '@/types'

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBarbero, setSelectedBarbero] = useState<string | 'all'>('all')

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { data: citasData, isLoading: loadingCitas } = useAppointments({
    fecha:     dateStr,
    barberoId: selectedBarbero === 'all' ? undefined : selectedBarbero,
  })
  const { data: barberos } = useBarbers()

  const citas = citasData?.data ?? []

  // Group by barber
  const byBarbero = (barberos ?? []).reduce<Record<string, Cita[]>>((acc, b) => {
    if (selectedBarbero !== 'all' && b.id !== selectedBarbero) return acc
    acc[b.id] = citas.filter(c => c.barberoId === b.id)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
            <ChevronLeft size={16} />
          </Button>
          <div className="text-center min-w-[200px]">
            <p className="text-lg font-semibold capitalize">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            {isToday(selectedDate) && (
              <p className="text-xs text-primary font-medium">Hoy</p>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
            <ChevronRight size={16} />
          </Button>
          {!isToday(selectedDate) && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>
              Hoy
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Barber filter */}
          <select
            value={selectedBarbero}
            onChange={e => setSelectedBarbero(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos los barberos</option>
            {(barberos ?? []).map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>

          <Button asChild>
            <Link href="/citas/nueva">
              <Plus size={16} className="mr-1.5" />
              Nueva Cita
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total citas',   value: citas.length,                                          color: 'text-foreground' },
          { label: 'Pendientes',    value: citas.filter(c => c.estado === 'PENDIENTE').length,    color: 'text-yellow-400' },
          { label: 'En proceso',    value: citas.filter(c => c.estado === 'EN_PROCESO').length,   color: 'text-purple-400' },
          { label: 'Completadas',   value: citas.filter(c => c.estado === 'COMPLETADA').length,   color: 'text-green-400'  },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Agenda by barber */}
      {loadingCitas ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(byBarbero).map(([barberoId, citasList]) => {
            const barbero = (barberos ?? []).find(b => b.id === barberoId)
            if (!barbero) return null
            return (
              <BarberoColumn
                key={barberoId}
                barbero={barbero}
                citas={citasList.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())}
              />
            )
          })}
          {Object.keys(byBarbero).length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">Sin citas para este día</p>
              <p className="text-sm mt-1">Crea una nueva cita para comenzar</p>
              <Button asChild className="mt-4">
                <Link href="/citas/nueva"><Plus size={16} className="mr-1.5" />Nueva Cita</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BarberoColumn({ barbero, citas }: { barbero: Barbero; citas: Cita[] }) {
  return (
    <div className="rounded-xl border bg-card flex flex-col overflow-hidden">
      {/* Column header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-secondary/30">
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
          {barbero.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold">{barbero.nombre}</p>
          <p className="text-xs text-muted-foreground">{citas.length} cita{citas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Appointment cards */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {citas.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-xs text-muted-foreground">Sin citas asignadas</p>
          </div>
        ) : (
          citas.map(cita => <CitaCard key={cita.id} cita={cita} />)
        )}
      </div>
    </div>
  )
}

function CitaCard({ cita }: { cita: Cita }) {
  return (
    <Link href={`/cobrar?citaId=${cita.id}`}>
      <div className="rounded-lg border bg-background hover:border-primary/50 hover:bg-primary/5 transition-colors p-3 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-medium truncate">
              <User size={12} className="shrink-0 text-muted-foreground" />
              {cita.cliente.nombre}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{cita.servicios.map(s => s.servicio.nombre).join(', ')}</p>
          </div>
          <Badge className={cn('badge-estado shrink-0', ESTADO_CITA_COLORS[cita.estado])}>
            {ESTADO_CITA_LABELS[cita.estado]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Clock size={11} />
          {formatTime(cita.fechaHora)}
          <span className="mx-1">·</span>
          {cita.duracionMin} min
        </div>
      </div>
    </Link>
  )
}
