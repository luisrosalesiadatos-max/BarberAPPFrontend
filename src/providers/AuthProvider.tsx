'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { queryClient } from '@/lib/query-client'
import { User } from '@/types'

interface AuthContextValue {
  user:        User | null
  loading:     boolean
  login:       (email: string, password: string) => Promise<void>
  logout:      () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function refreshUser() {
    try {
      const res  = await api.get('/api/auth/me')
      const next = res.data as User
      // Si cambió la barbería (cambio de tenant), limpiar cache completamente
      if (user?.barberiaId !== next.barberiaId) {
        queryClient.clear()
      }
      setUser(next)
    } catch {
      setUser(null)
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post('/api/auth/login', { email, password })
    // Limpiar cache ANTES de cambiar el usuario para que ningún
    // componente muestre datos del tenant anterior
    queryClient.clear()
    setUser(res.data.user)
    router.push('/agenda')
  }

  async function logout() {
    await api.post('/api/auth/logout')
    // Limpiar cache al salir — el próximo usuario empieza desde cero
    queryClient.clear()
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
