'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, UserRound, Phone, Mail } from 'lucide-react'
import { useBarbers, useCreateBarbero, useUpdateBarbero, useDeleteBarbero } from '@/hooks/useBarbers'
import { useToast } from '@/components/ui/use-toast'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Badge }    from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Barbero } from '@/types'

const schema = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres'),
  apellido: z.string().optional(),
  telefono: z.string().optional(),
  email:    z.string().email('Email inválido').optional().or(z.literal('')),
  activo:   z.boolean().default(true),
})
type FormData = z.infer<typeof schema>

export default function BarberosPage() {
  const { data: barberos, isLoading } = useBarbers()
  const createBarbero = useCreateBarbero()
  const updateBarbero = useUpdateBarbero()
  const deleteBarbero = useDeleteBarbero()
  const { toast } = useToast()

  const [dialogOpen,  setDialogOpen]  = useState(false)
  const [editBarbero, setEditBarbero] = useState<Barbero | null>(null)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function openCreate() {
    setEditBarbero(null)
    reset({ nombre: '', apellido: '', telefono: '', email: '', activo: true })
    setDialogOpen(true)
  }

  function openEdit(b: Barbero) {
    setEditBarbero(b)
    reset({
      nombre:   b.nombre,
      apellido: b.apellido ?? '',
      telefono: b.telefono ?? '',
      email:    b.email    ?? '',
      activo:   b.activo,
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: FormData) {
    const payload = {
      nombre:   data.nombre,
      apellido: data.apellido || undefined,
      telefono: data.telefono || undefined,
      email:    data.email    || undefined,
      activo:   data.activo,
    }
    try {
      if (editBarbero) {
        await updateBarbero.mutateAsync({ id: editBarbero.id, ...payload })
        toast({ title: 'Barbero actualizado' })
      } else {
        await createBarbero.mutateAsync(payload)
        toast({ title: 'Barbero creado' })
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error ?? 'Error al guardar' })
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteBarbero.mutateAsync(id)
      toast({ title: 'Barbero desactivado' })
    } catch {
      toast({ variant: 'destructive', title: 'Error al desactivar barbero' })
    } finally {
      setDeletingId(null)
    }
  }

  const activos  = (barberos ?? []).filter(b => b.activo)
  const inactivos = (barberos ?? []).filter(b => !b.activo)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activos.length} {activos.length === 1 ? 'barbero activo' : 'barberos activos'}
        </p>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" />
          Nuevo Barbero
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : (barberos ?? []).length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <UserRound size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin barberos registrados</p>
          <p className="text-sm mt-1">Agrega los barberos que trabajan en tu barbería</p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus size={16} className="mr-1.5" />
            Agregar primer barbero
          </Button>
        </div>
      ) : (
        <>
          {activos.length > 0 && (
            <div className="rounded-xl border overflow-hidden divide-y">
              {activos.map(b => (
                <BarberoRow
                  key={b.id}
                  barbero={b}
                  deletingId={deletingId}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {inactivos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Inactivos</h3>
              <div className="rounded-xl border overflow-hidden divide-y opacity-60">
                {inactivos.map(b => (
                  <BarberoRow
                    key={b.id}
                    barbero={b}
                    deletingId={deletingId}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBarbero ? 'Editar barbero' : 'Nuevo barbero'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input {...register('nombre')} placeholder="Juan" />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Apellido</Label>
                <Input {...register('apellido')} placeholder="Pérez" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input {...register('telefono')} placeholder="3001234567" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input {...register('email')} placeholder="juan@ejemplo.com" type="email" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createBarbero.isPending || updateBarbero.isPending}>
                {(createBarbero.isPending || updateBarbero.isPending) && (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                )}
                {editBarbero ? 'Guardar cambios' : 'Crear barbero'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BarberoRow({
  barbero,
  deletingId,
  onEdit,
  onDelete,
}: {
  barbero:    Barbero
  deletingId: string | null
  onEdit:     (b: Barbero) => void
  onDelete:   (id: string) => void
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <UserRound size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">
            {barbero.nombre}{barbero.apellido ? ` ${barbero.apellido}` : ''}
          </p>
          {!barbero.activo && <Badge variant="outline" className="text-xs">Inactivo</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {barbero.telefono && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone size={11} />
              {barbero.telefono}
            </span>
          )}
          {barbero.email && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail size={11} />
              {barbero.email}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(barbero)}>
          <Pencil size={14} />
        </Button>
        {barbero.activo && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            disabled={deletingId === barbero.id}
            onClick={() => onDelete(barbero.id)}
          >
            {deletingId === barbero.id
              ? <Loader2 size={14} className="animate-spin" />
              : <Trash2 size={14} />
            }
          </Button>
        )}
      </div>
    </div>
  )
}
