import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Barbero } from '@/types'

const KEY = ['barbers'] as const

export function useBarbers() {
  return useQuery<Barbero[]>({
    queryKey: KEY,
    queryFn:  () => api.get('/api/barbers').then(r => r.data),
    staleTime: 10 * 60 * 1000, // barberos cambian poco
  })
}

export function useCreateBarbero() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Barbero>) =>
      api.post<Barbero>('/api/barbers', data).then(r => r.data),
    onSuccess: (nuevo) => {
      qc.setQueryData<Barbero[]>(KEY, old => (old ? [...old, nuevo] : [nuevo]))
    },
  })
}

export function useUpdateBarbero() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Barbero> & { id: string }) =>
      api.put<Barbero>(`/api/barbers/${id}`, data).then(r => r.data),
    onSuccess: (updated) => {
      qc.setQueryData<Barbero[]>(KEY, old =>
        old ? old.map(b => (b.id === updated.id ? updated : b)) : [updated],
      )
    },
  })
}

export function useDeleteBarbero() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/barbers/${id}`).then(r => r.data),
    onSuccess: (_data, id) => {
      qc.setQueryData<Barbero[]>(KEY, old =>
        old ? old.map(b => (b.id === id ? { ...b, activo: false } : b)) : [],
      )
    },
  })
}
