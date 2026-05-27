'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, Trash2, Loader2, Store } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import {
  useBarberia,
  useUpdateBarberiaLogo,
  useDeleteBarberiaLogo,
  useUpdateBarberiaNombre,
} from '@/hooks/useBarberia'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Card }   from '@/components/ui/card'

const nombreSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
})
type NombreForm = z.infer<typeof nombreSchema>

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const isAdmin  = user?.rol === 'ADMIN'

  const { data: barberia, isLoading } = useBarberia()
  const uploadLogo  = useUpdateBarberiaLogo()
  const deleteLogo  = useDeleteBarberiaLogo()
  const updateNombre = useUpdateBarberiaNombre()

  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]   = useState(false)
  const [preview,  setPreview]    = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<NombreForm>({
    resolver: zodResolver(nombreSchema),
    values:   { nombre: barberia?.nombre ?? '' },
  })

  function handleFileSelect(file: File) {
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      toast({ variant: 'destructive', title: 'Formato no válido', description: 'Solo se aceptan imágenes JPG, PNG o WebP.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Archivo muy grande', description: 'El logo debe pesar menos de 2 MB.' })
      return
    }
    setPreview(URL.createObjectURL(file))
    uploadLogo.mutate(file, {
      onSuccess: () => {
        setPreview(null)
        toast({ title: 'Logo actualizado' })
      },
      onError: (err: any) => {
        setPreview(null)
        toast({
          variant:     'destructive',
          title:       'Error al subir el logo',
          description: err?.response?.data?.error ?? err?.message,
        })
      },
    })
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  function onNombreSubmit(data: NombreForm) {
    updateNombre.mutate(data.nombre, {
      onSuccess: () => toast({ title: 'Nombre actualizado' }),
      onError:   (err: any) => toast({
        variant:     'destructive',
        title:       'Error al actualizar el nombre',
        description: err?.response?.data?.error ?? err?.message,
      }),
    })
  }

  const logoSrc = preview ?? barberia?.logoUrl ?? null
  const uploading = uploadLogo.isPending

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Configuración</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Personaliza la información de tu barbería.</p>
      </div>

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <Card className="p-6">
        <h3 className="font-medium mb-1">Logo de la barbería</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Aparece en la barra lateral. JPG, PNG o WebP · máx. 2 MB.
        </p>

        <div className="flex items-start gap-6">
          {/* Preview circle */}
          <div
            className={`relative w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-colors cursor-pointer ${
              dragging
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted/30 hover:border-primary/50'
            } ${!isAdmin ? 'pointer-events-none opacity-60' : ''}`}
            onClick={() => isAdmin && fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            {uploading ? (
              <Loader2 size={28} className="text-muted-foreground animate-spin" />
            ) : logoSrc ? (
              <Image
                src={logoSrc}
                alt="Logo barbería"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <Store size={28} className="text-muted-foreground" />
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload size={15} className="mr-2" />
                  {logoSrc ? 'Cambiar logo' : 'Subir logo'}
                </Button>

                {barberia?.logoUrl && !uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex"
                    disabled={deleteLogo.isPending}
                    onClick={() =>
                      deleteLogo.mutate(undefined, {
                        onSuccess: () => toast({ title: 'Logo eliminado' }),
                        onError:   (err: any) => toast({
                          variant:     'destructive',
                          title:       'Error al eliminar el logo',
                          description: err?.response?.data?.error ?? err?.message,
                        }),
                      })
                    }
                  >
                    {deleteLogo.isPending
                      ? <Loader2 size={15} className="mr-2 animate-spin" />
                      : <Trash2 size={15} className="mr-2" />
                    }
                    Eliminar
                  </Button>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? 'Haz clic o arrastra una imagen aquí.'
                : 'Solo el administrador puede cambiar el logo.'}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
            e.target.value = ''
          }}
        />
      </Card>

      {/* ── Nombre ───────────────────────────────────────────────────────── */}
      <Card className="p-6">
        <h3 className="font-medium mb-1">Nombre de la barbería</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Se muestra en la barra lateral y en los reportes.
        </p>

        {isLoading ? (
          <div className="h-9 w-64 rounded-md bg-muted animate-pulse" />
        ) : (
          <form onSubmit={handleSubmit(onNombreSubmit)} className="flex items-start gap-3">
            <div className="flex-1 max-w-xs space-y-1">
              <Label htmlFor="nombre" className="sr-only">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Barbería El Estilo"
                disabled={!isAdmin}
                {...register('nombre')}
                aria-invalid={!!errors.nombre}
              />
              {errors.nombre && (
                <p className="text-xs text-destructive">{errors.nombre.message}</p>
              )}
            </div>
            {isAdmin && (
              <Button
                type="submit"
                size="sm"
                disabled={!isDirty || updateNombre.isPending}
              >
                {updateNombre.isPending && <Loader2 size={14} className="mr-2 animate-spin" />}
                Guardar
              </Button>
            )}
          </form>
        )}
      </Card>
    </div>
  )
}
