'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  nombreBarberia:  z.string().min(2, 'Mínimo 2 caracteres').max(100),
  nombre:          z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email:           z.string().email('Correo inválido'),
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router  = useRouter()
  const { refreshUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await api.post('/api/auth/register', {
        nombreBarberia: data.nombreBarberia,
        nombre:         data.nombre,
        email:          data.email,
        password:       data.password,
      })
      // Carga el usuario en AuthProvider antes de navegar,
      // porque el useEffect de AuthProvider ya se ejecutó antes del registro
      await refreshUser()
      toast({ title: '¡Cuenta creada!', description: `Bienvenido a ${data.nombreBarberia}` })
      router.push('/agenda')
    } catch (err: any) {
      toast({
        variant:     'destructive',
        title:       'Error al registrarse',
        description: err?.response?.data?.error ?? 'Ocurrió un error inesperado',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-xl shadow-black/20">
      <h2 className="text-xl font-semibold mb-6">Crear cuenta</h2>
      <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

        <div className="space-y-1.5">
          <Label htmlFor="nombreBarberia">Nombre de tu barbería</Label>
          <Input
            id="nombreBarberia"
            placeholder="Barbería El Estilo"
            {...register('nombreBarberia')}
            aria-invalid={!!errors.nombreBarberia}
          />
          {errors.nombreBarberia && <p className="text-xs text-destructive">{errors.nombreBarberia.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nombre">Tu nombre</Label>
          <Input
            id="nombre"
            placeholder="Luis García"
            {...register('nombre')}
            aria-invalid={!!errors.nombre}
          />
          {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@mibarberia.com"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            {...register('password')}
            aria-invalid={!!errors.password}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
          Crear cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
