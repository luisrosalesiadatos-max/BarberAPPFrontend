import axios from 'axios'

export const api = axios.create({
  baseURL:         '',
  withCredentials: true, // sends httpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
})

// Rutas de auth que nunca deben disparar un intento de refresh.
// /me, /refresh y /login son rutas de verificación de sesión — si devuelven 401
// es esperado y no hay que reintentar; el componente que las llama lo maneja.
const SKIP_REFRESH = ['/api/auth/me', '/api/auth/refresh', '/api/auth/login', '/api/auth/register', '/api/auth/logout']

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    const url: string = originalRequest?.url ?? ''
    const isAuthRoute = SKIP_REFRESH.some(u => url.includes(u))

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true
      try {
        await api.post('/api/auth/refresh')
        return api(originalRequest)
      } catch {
        // Refresh failed — clear session and go to login
        try { await api.post('/api/auth/logout') } catch {}
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
