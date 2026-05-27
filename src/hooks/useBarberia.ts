import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Barberia } from '@/types'

export function useBarberia() {
  return useQuery<Barberia>({
    queryKey: ['barberia'],
    queryFn:  () => api.get('/api/barberia').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateBarberiaLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post<Barberia>('/api/barberia/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Barberia>(['barberia'], data)
    },
  })
}

export function useDeleteBarberiaLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete<Barberia>('/api/barberia/logo').then(r => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData<Barberia>(['barberia'], data)
    },
  })
}

export function useUpdateBarberiaNombre() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (nombre: string) =>
      api.patch<Barberia>('/api/barberia', { nombre }).then(r => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData<Barberia>(['barberia'], data)
    },
  })
}
