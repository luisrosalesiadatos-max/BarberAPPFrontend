'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Loader2, Search, Plus } from 'lucide-react'
import { useCreateAppointment } from '@/hooks/useAppointments'
import { useBarbers }           from '@/hooks/useBarbers'
import { useServices }          from '@/hooks/useServices'
import { useClients }           from '@/hooks/useClients'
import { useCreateClient }      from '@/hooks/useClients'
import { useToast }             from '@/components/ui/use-toast'
import { Button }               from '@/components/ui/button'
import { Input }                from '@/components/ui/input'
import { Label }                from '@/components/ui/label'
import { Textarea }             from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Cliente } from '@/types'

const schema = z.object({
  clienteId:  z.string().min(1, 'Selecciona un cliente'),
  barberoId:  z.string().min(1, 'Selecciona un barbero'),
  servicioId: z.string().min(1, 'Selecciona un servicio'),
  fecha:      z.string().min(1, 'Selecciona una fecha'),
  hora:       z.string().min(1, 'Selecciona una hora'),
  notas:      z.string().max(500).optional(),
})
type FormData = z.infer<typeof schema>

export default function NuevaCitaPage() {
  const router  = useRouter()
  const { toast } = useToast()
  const [clientSearch,  setClientSearch]  = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientCedula, setNewClientCedula] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')

  const { data: barberos  } = useBarbers()
  const { data: servicios } = useServices()
  const { data: clientsData } = useClients({ q: clientSearch, limit: 10 })
  const createAppointment = useCreateAppointment()
  const createClient      = useCreateClient()

  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fecha: format(new Date(), 'yyyy-MM-dd') },
  })

  const servicioId = watch('servicioId')
  const selectedServicio = (servicios ?? []).find(s => s.id === servicioId)

  async function onSubmit(data: FormData) {
    const fechaHora = `${data.fecha}T${data.hora}:00.000Z`
    try {
      await createAppointment.mutateAsync({
        clienteId: data.clienteId,
        barberoId: data.barberoId,
        servicios: [{
          servicioId:  data.servicioId,
          precio:      selectedServicio?.precio ?? 0,
          duracionMin: selectedServicio?.duracionMin ?? 30,
          orden:       1,
        }],
        duracionMin: selectedServicio?.duracionMin ?? 30,
        fechaHora,
        notas: data.notas,
      })
      toast({ title: 'Cita creada', description: 'La cita fue registrada exitosamente' })
      router.push('/agenda')
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error ?? 'No se pudo crear la cita' })
    }
  }

  async function handleCreateClient() {
    if (!newClientCedula || !newClientName) return
    try {
      const client = await createClient.mutateAsync({
        cedula:   newClientCedula,
        nombre:   newClientName,
        telefono: newClientPhone || undefined,
      } as any)
      setValue('clienteId', client.id)
      setShowNewClient(false)
      toast({ title: 'Cliente creado' })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error ?? 'No se pudo crear el cliente' })
    }
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Client selector */}
        <Card>
          <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula o teléfono..."
                className="pl-9"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
              />
            </div>

            <Controller
              name="clienteId"
              control={control}
              render={({ field }) => (
                <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border divide-y">
                  {(clientsData?.data ?? []).length === 0 && clientSearch && (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      No se encontraron clientes.{' '}
                      <button type="button" className="text-primary hover:underline" onClick={() => setShowNewClient(true)}>
                        Crear nuevo
                      </button>
                    </div>
                  )}
                  {(clientsData?.data ?? []).map((c: Cliente) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { field.onChange(c.id); setClientSearch('') }}
                      className={`w-full text-left px-3 py-2.5 hover:bg-secondary text-sm transition-colors ${field.value === c.id ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      <p className="font-medium">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">{c.cedula} · {c.telefono ?? 'Sin teléfono'}</p>
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.clienteId && <p className="text-xs text-destructive">{errors.clienteId.message}</p>}

            <Button type="button" variant="outline" size="sm" onClick={() => setShowNewClient(v => !v)}>
              <Plus size={14} className="mr-1.5" />
              Crear nuevo cliente
            </Button>

            {showNewClient && (
              <div className="rounded-lg border p-4 space-y-3 bg-secondary/20">
                <p className="text-sm font-medium">Nuevo cliente</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Cédula *</Label>
                    <Input placeholder="12345678" value={newClientCedula} onChange={e => setNewClientCedula(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Nombre *</Label>
                    <Input placeholder="Nombre completo" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Teléfono</Label>
                    <Input placeholder="3001234567" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
                  </div>
                </div>
                <Button type="button" size="sm" onClick={handleCreateClient} disabled={createClient.isPending}>
                  {createClient.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                  Guardar cliente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service + Barber */}
        <Card>
          <CardHeader><CardTitle className="text-base">Servicio y Barbero</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Servicio *</Label>
              <Controller
                name="servicioId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {(servicios ?? []).filter(s => s.activo).map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre} — {formatCurrency(s.precio)} ({s.duracionMin} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.servicioId && <p className="text-xs text-destructive">{errors.servicioId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Barbero *</Label>
              <Controller
                name="barberoId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar barbero" />
                    </SelectTrigger>
                    <SelectContent>
                      {(barberos ?? []).filter(b => b.activo).map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.barberoId && <p className="text-xs text-destructive">{errors.barberoId.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader><CardTitle className="text-base">Fecha y Hora</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  min={today}
                  {...register('fecha')}
                />
                {errors.fecha && <p className="text-xs text-destructive">{errors.fecha.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hora">Hora *</Label>
                <Input
                  id="hora"
                  type="time"
                  step="900"
                  {...register('hora')}
                />
                {errors.hora && <p className="text-xs text-destructive">{errors.hora.message}</p>}
              </div>
            </div>

            {selectedServicio && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
                <p className="font-medium text-primary">Resumen</p>
                <p className="text-muted-foreground mt-1">{selectedServicio.nombre} — {selectedServicio.duracionMin} minutos — {formatCurrency(selectedServicio.precio)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Notas (opcional)</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              placeholder="Instrucciones especiales, estilo preferido..."
              {...register('notas')}
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={createAppointment.isPending}>
            {createAppointment.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
            Crear Cita
          </Button>
        </div>
      </form>
    </div>
  )
}
