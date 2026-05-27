'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2, Search, Scissors, ShoppingBag } from 'lucide-react'
import { useAppointment }  from '@/hooks/useAppointments'
import { useProducts }     from '@/hooks/useProducts'
import { useServices }     from '@/hooks/useServices'
import { useClients }      from '@/hooks/useClients'
import { useBarbers }      from '@/hooks/useBarbers'
import { useCheckout }     from '@/hooks/useSales'
import { useToast }        from '@/components/ui/use-toast'
import { Button }          from '@/components/ui/button'
import { Input }           from '@/components/ui/input'
import { Label }           from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import type { Producto } from '@/types'

interface LineItem {
  id:          string
  productoId?: string
  servicioId?: string
  descripcion: string
  cantidad:    number
  precioUnit:  number
}

const schema = z.object({
  clienteId:  z.string().min(1, 'Requerido'),
  barberoId:  z.string().min(1, 'Requerido'),
  descuento:  z.coerce.number().min(0),
  metodoPago: z.enum(['EFECTIVO','TARJETA','TRANSFERENCIA','NEQUI','DAVIPLATA']),
})
type FormData = z.infer<typeof schema>

export default function CobrarPage() {
  return (
    <Suspense fallback={null}>
      <CobrarContent />
    </Suspense>
  )
}

function CobrarContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const { toast }    = useToast()
  const citaId       = searchParams.get('citaId') ?? undefined

  const { data: cita }        = useAppointment(citaId ?? '')
  const { data: productos }   = useProducts()
  const { data: servicios }   = useServices()
  const { data: clientsData } = useClients({})
  const { data: barberos }    = useBarbers()
  const checkout              = useCheckout()

  const [servicioItems, setServicioItems] = useState<LineItem[]>([])
  const [productoItems, setProductoItems] = useState<LineItem[]>([])
  const [searchProd,    setSearchProd]    = useState('')
  const [selectedSvc,   setSelectedSvc]  = useState('')

  const { control, register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { descuento: 0, metodoPago: 'EFECTIVO' },
  })

  useEffect(() => {
    if (cita) {
      setValue('clienteId', cita.clienteId)
      setValue('barberoId', cita.barberoId)
      if (servicioItems.length === 0 && cita.servicios.length > 0) {
        setServicioItems(cita.servicios.map(cs => ({
          id:          crypto.randomUUID(),
          servicioId:  cs.servicioId,
          descripcion: cs.servicio.nombre,
          cantidad:    1,
          precioUnit:  Number(cs.precio),
        })))
      }
    }
  }, [cita, servicioItems.length, setValue])

  const descuento  = watch('descuento') || 0
  const allItems   = [...servicioItems, ...productoItems]
  const subtotal   = allItems.reduce((a, i) => a + i.cantidad * i.precioUnit, 0)
  const total      = Math.max(0, subtotal - descuento)

  // ── Servicios ──────────────────────────────────────────────────────────────
  function addServiceFromCatalog() {
    if (!selectedSvc) return
    const svc = (servicios ?? []).find(s => s.id === selectedSvc)
    if (!svc) return
    setServicioItems(prev => {
      const existing = prev.find(i => i.servicioId === svc.id)
      if (existing) return prev.map(i => i.servicioId === svc.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { id: crypto.randomUUID(), servicioId: svc.id, descripcion: svc.nombre, cantidad: 1, precioUnit: Number(svc.precio) }]
    })
    setSelectedSvc('')
  }

  function addServiceManual() {
    setServicioItems(prev => [...prev, { id: crypto.randomUUID(), descripcion: '', cantidad: 1, precioUnit: 0 }])
  }

  function removeServicio(id: string) {
    setServicioItems(prev => prev.filter(i => i.id !== id))
  }

  function updateServicio(id: string, field: keyof LineItem, value: string | number) {
    setServicioItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // ── Productos ──────────────────────────────────────────────────────────────
  function addProduct(prod: Producto) {
    setProductoItems(prev => {
      const existing = prev.find(i => i.productoId === prod.id)
      if (existing) return prev.map(i => i.productoId === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { id: crypto.randomUUID(), productoId: prod.id, descripcion: prod.nombre, cantidad: 1, precioUnit: Number(prod.precioVenta) }]
    })
    setSearchProd('')
  }

  function removeProducto(id: string) {
    setProductoItems(prev => prev.filter(i => i.id !== id))
  }

  function updateProducto(id: string, field: keyof LineItem, value: string | number) {
    setProductoItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: FormData) {
    if (allItems.length === 0) {
      toast({ variant: 'destructive', title: 'Sin items', description: 'Agrega al menos un servicio o producto' })
      return
    }
    try {
      await checkout.mutateAsync({
        citaId:     citaId ?? null,
        clienteId:  data.clienteId,
        barberoId:  data.barberoId,
        items:      allItems.map((i, idx) => ({
          tipo:        i.productoId ? 'PRODUCTO' : 'SERVICIO',
          servicioId:  i.servicioId ?? null,
          productoId:  i.productoId ?? null,
          descripcion: i.descripcion,
          cantidad:    i.cantidad,
          precioUnit:  i.precioUnit,
          descuento:   0,
          orden:       idx + 1,
        })),
        descuento:  data.descuento,
        metodoPago: data.metodoPago,
      })
      toast({ title: '¡Venta registrada!', description: `Total: ${formatCurrency(total)}` })
      router.push('/agenda')
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error ?? 'Error al procesar el pago' })
    }
  }

  const filteredProducts = (productos ?? []).filter(p =>
    p.nombre.toLowerCase().includes(searchProd.toLowerCase())
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {cita && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
          <p className="font-medium text-primary">Cita vinculada</p>
          <p className="text-muted-foreground mt-0.5">
            {cita.cliente.nombre} · {cita.servicios.map(s => s.servicio.nombre).join(', ')} · {cita.barbero.nombre}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cliente & Barbero */}
        {!cita && (
          <Card>
            <CardHeader><CardTitle className="text-base">Cliente y Barbero</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <Controller
                  name="clienteId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                      <SelectContent>
                        {(clientsData?.data ?? []).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.clienteId && <p className="text-xs text-destructive">{errors.clienteId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Barbero *</Label>
                <Controller
                  name="barberoId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar barbero" /></SelectTrigger>
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
        )}

        {/* ── Servicios ── */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors size={16} className="text-primary" />
              Servicios
            </CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={addServiceManual}>
              <Plus size={14} className="mr-1.5" />
              Línea libre
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Selector del catálogo */}
            <div className="flex gap-2">
              <Select value={selectedSvc} onValueChange={setSelectedSvc}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar del catálogo..." />
                </SelectTrigger>
                <SelectContent>
                  {(servicios ?? []).filter(s => s.activo).map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <span>{s.nombre}</span>
                      <span className="ml-2 text-muted-foreground text-xs">{formatCurrency(s.precio)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={addServiceFromCatalog} disabled={!selectedSvc}>
                <Plus size={14} className="mr-1" />
                Agregar
              </Button>
            </div>

            {/* Lista de servicios */}
            <div className="space-y-2">
              {servicioItems.map(item => (
                <div key={item.id} className="grid grid-cols-[1fr_70px_90px_32px] gap-2 items-center">
                  <Input
                    placeholder="Descripción del servicio"
                    value={item.descripcion}
                    onChange={e => updateServicio(item.id, 'descripcion', e.target.value)}
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={item.cantidad}
                    onChange={e => updateServicio(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Precio"
                    value={item.precioUnit}
                    onChange={e => updateServicio(item.id, 'precioUnit', parseFloat(e.target.value) || 0)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-9 w-9"
                    onClick={() => removeServicio(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {servicioItems.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-3">
                  Sin servicios — selecciona del catálogo o agrega una línea libre
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Productos ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag size={16} className="text-primary" />
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Búsqueda de inventario */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto del inventario..."
                className="pl-9"
                value={searchProd}
                onChange={e => setSearchProd(e.target.value)}
              />
            </div>
            {searchProd && (
              <div className="rounded-lg border divide-y max-h-40 overflow-y-auto">
                {filteredProducts.slice(0, 8).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary text-sm transition-colors flex justify-between"
                  >
                    <span>{p.nombre}</span>
                    <span className="text-muted-foreground">{formatCurrency(p.precioVenta)}</span>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>
                )}
              </div>
            )}

            {/* Lista de productos */}
            <div className="space-y-2">
              {productoItems.map(item => (
                <div key={item.id} className="grid grid-cols-[1fr_70px_90px_32px] gap-2 items-center">
                  <Input
                    placeholder="Producto"
                    value={item.descripcion}
                    readOnly
                    className="bg-secondary/40"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={item.cantidad}
                    onChange={e => updateProducto(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Precio"
                    value={item.precioUnit}
                    readOnly
                    className="bg-secondary/40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-9 w-9"
                    onClick={() => removeProducto(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {productoItems.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-3">
                  Sin productos — busca en el inventario arriba
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totales y Pago */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pago</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="descuento">Descuento ($)</Label>
                <Input
                  id="descuento"
                  type="number"
                  min="0"
                  step="100"
                  {...register('descuento')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Método de pago *</Label>
                <Controller
                  name="metodoPago"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                        <SelectItem value="TARJETA">Tarjeta</SelectItem>
                        <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                        <SelectItem value="NEQUI">Nequi</SelectItem>
                        <SelectItem value="DAVIPLATA">Daviplata</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Resumen */}
            <div className="rounded-xl bg-secondary/30 border p-4 space-y-2">
              {servicioItems.length > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Scissors size={12} /> Servicios</span>
                  <span>{formatCurrency(servicioItems.reduce((a, i) => a + i.cantidad * i.precioUnit, 0))}</span>
                </div>
              )}
              {productoItems.length > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><ShoppingBag size={12} /> Productos</span>
                  <span>{formatCurrency(productoItems.reduce((a, i) => a + i.cantidad * i.precioUnit, 0))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Descuento</span>
                  <span>- {formatCurrency(descuento)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={checkout.isPending}>
              {checkout.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
              Registrar Pago — {formatCurrency(total)}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
