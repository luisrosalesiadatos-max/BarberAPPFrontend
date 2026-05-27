import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Servicio } from '@/types'

const KEY = ['services'] as const

export function useServices() {
  return useQuery<Servicio[]>({
    queryKey: KEY,
    queryFn:  () => api.get('/api/services').then(r => r.data),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Servicio>) =>
      api.post<Servicio>('/api/services', data).then(r => r.data),
    onSuccess: (nuevo) => {
      qc.setQueryData<Servicio[]>(KEY, old => (old ? [...old, nuevo] : [nuevo]))
    },
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Servicio> & { id: string }) =>
      api.put<Servicio>(`/api/services/${id}`, data).then(r => r.data),
    onSuccess: (updated) => {
      qc.setQueryData<Servicio[]>(KEY, old =>
        old ? old.map(s => (s.id === updated.id ? updated : s)) : [updated],
      )
    },
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/services/${id}`).then(r => r.data),
    onSuccess: (_data, id) => {
      qc.setQueryData<Servicio[]>(KEY, old =>
        old ? old.filter(s => s.id !== id) : [],
      )
    },
  })
}
