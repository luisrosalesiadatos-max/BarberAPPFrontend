'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/providers/AuthProvider'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login }        = useAuth()
  const { toast }        = useToast()
  const [showPwd, setShowPwd] = useState(false)
  const [loading,  setLoading]  = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await login(data.email, data.password)
    } catch (err: any) {
      toast({
        variant:     'destructive',
        title:       'Error al iniciar sesión',
        description: err?.response?.data?.error ?? 'Credenciales inválidas',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-xl shadow-black/20">
      <h2 className="text-xl font-semibold mb-6">Iniciar sesión</h2>
      <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="barberia@correo.com"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
              {...register('password')}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
          Ingresar
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        ¿Aún no tienes cuenta?{' '}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Registrar barbería
        </Link>
      </p>
    </div>
  )
}
