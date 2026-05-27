'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Clock, Loader2, Scissors } from 'lucide-react'
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/useServices'
import { useToast } from '@/components/ui/use-toast'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge }    from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import type { Servicio } from '@/types'

const schema = z.object({
  nombre:      z.string().min(2, 'Requerido'),
  descripcion: z.string().optional(),
  precio:      z.coerce.number().positive('Precio requerido'),
  duracionMin: z.coerce.number().int().min(5).default(30),
  categoria:   z.string().default('General'),
  activo:      z.boolean().default(true),
})
type FormData = z.infer<typeof schema>

export default function ServiciosPage() {
  const { data: servicios, isLoading } = useServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()
  const { toast }     = useToast()

  const [dialogOpen,  setDialogOpen]  = useState(false)
  const [editService, setEditService] = useState<Servicio | null>(null)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Group by category
  const byCategoria = (servicios ?? []).reduce<Record<string, Servicio[]>>((acc, s) => {
    const cat = s.categoria || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  function openCreate() {
    setEditService(null)
    reset({ duracionMin: 30, categoria: 'General', activo: true })
    setDialogOpen(true)
  }

  function openEdit(s: Servicio) {
    setEditService(s)
    reset({
      nombre:      s.nombre,
      descripcion: s.descripcion ?? '',
      precio:      s.precio,
      duracionMin: s.duracionMin,
      categoria:   s.categoria,
      activo:      s.activo,
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: FormData) {
    try {
      if (editService) {
        await updateService.mutateAsync({ id: editService.id, ...data } as any)
        toast({ title: 'Servicio actualizado' })
      } else {
        await createService.mutateAsync(data as any)
        toast({ title: 'Servicio creado' })
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error ?? 'Error al guardar' })
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteService.mutateAsync(id)
      toast({ title: 'Servicio desactivado' })
    } catch {
      toast({ variant: 'destructive', title: 'Error al eliminar servicio' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {(servicios ?? []).filter(s => s.activo).length} servicios activos
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" />
          Nuevo Servicio
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-48 rounded-xl bg-secondary/30 animate-pulse" />)}
        </div>
      ) : Object.keys(byCategoria).length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <Scissors size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin servicios registrados</p>
          <p className="text-sm mt-1">Agrega los servicios que ofrece tu barbería</p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus size={16} className="mr-1.5" />
            Crear primer servicio
          </Button>
        </div>
      ) : (
        Object.entries(byCategoria).map(([categoria, items]) => (
          <div key={categoria} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{categoria}</h3>
            <div className="rounded-xl border overflow-hidden divide-y">
              {items.map(s => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Scissors size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{s.nombre}</p>
                      {!s.activo && <Badge variant="outline" className="text-xs">Inactivo</Badge>}
                    </div>
                    {s.descripcion && <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.descripcion}</p>}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock size={11} />
                      {s.duracionMin} min
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">{formatCurrency(s.precio)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={deletingId === s.id}
                      onClick={() => handleDelete(s.id)}
                    >
                      {deletingId === s.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editService ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input {...register('nombre')} placeholder="Corte clásico" />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea {...register('descripcion')} placeholder="Descripción del servicio..." rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Precio *</Label>
                <Input type="number" min="0" {...register('precio')} />
                {errors.precio && <p className="text-xs text-destructive">{errors.precio.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Duración (min)</Label>
                <Input type="number" min="5" {...register('duracionMin')} />
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Input {...register('categoria')} placeholder="Cortes" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createService.isPending || updateService.isPending}>
                {(createService.isPending || updateService.isPending) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {editService ? 'Guardar cambios' : 'Crear servicio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
