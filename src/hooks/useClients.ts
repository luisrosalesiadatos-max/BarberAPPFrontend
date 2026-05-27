import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Cliente, PaginatedResponse } from '@/types'

export function useClients(params?: { q?: string; page?: number; limit?: number }) {
  return useQuery<PaginatedResponse<Cliente>>({
    queryKey: ['clients', params],
    queryFn:  () => api.get('/api/clients', { params }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev, // mantiene datos anteriores mientras carga la nueva página
  })
}

export function useClient(id: string) {
  return useQuery<Cliente & { citas: any[]; ventas: any[] }>({
    queryKey: ['clients', id],
    queryFn:  () => api.get(`/api/clients/${id}`).then(r => r.data),
    enabled:  !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Cliente>) =>
      api.post<Cliente>('/api/clients', data).then(r => r.data),
    onSuccess: () => {
      // Lista paginada — invalida para que traiga la página actual actualizada
      qc.invalidateQueries({ queryKey: ['clients'], exact: false })
    },
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Cliente> & { id: string }) =>
      api.put<Cliente>(`/api/clients/${id}`, data).then(r => r.data),
    onSuccess: (updated) => {
      // Actualiza el detalle del cliente sin refetch
      qc.setQueryData(['clients', updated.id], (old: any) =>
        old ? { ...old, ...updated } : updated,
      )
      // Actualiza dentro de la lista paginada si está en cache
      qc.setQueriesData<PaginatedResponse<Cliente>>(
        { queryKey: ['clients'], exact: false },
        (old) =>
          old
            ? { ...old, data: old.data.map(c => (c.id === updated.id ? { ...c, ...updated } : c)) }
            : old,
      )
    },
  })
}
