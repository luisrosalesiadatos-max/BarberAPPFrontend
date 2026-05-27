import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Producto } from '@/types'

const KEY = (lowStock?: boolean) => ['products', { lowStock }] as const

export function useProducts(lowStock?: boolean) {
  return useQuery<Producto[]>({
    queryKey: KEY(lowStock),
    queryFn:  () =>
      api.get('/api/products', { params: lowStock ? { lowStock: 'true' } : undefined })
        .then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Producto>) =>
      api.post<Producto>('/api/products', data).then(r => r.data),
    onSuccess: (nuevo) => {
      qc.setQueryData<Producto[]>(KEY(), old => (old ? [...old, nuevo] : [nuevo]))
      qc.setQueryData<Producto[]>(KEY(false), old => (old ? [...old, nuevo] : [nuevo]))
    },
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Producto> & { id: string }) =>
      api.put<Producto>(`/api/products/${id}`, data).then(r => r.data),
    onSuccess: (updated) => {
      const patch = (old: Producto[] | undefined) =>
        old ? old.map(p => (p.id === updated.id ? updated : p)) : [updated]
      qc.setQueryData<Producto[]>(KEY(), patch)
      qc.setQueryData<Producto[]>(KEY(false), patch)
      qc.setQueryData<Producto[]>(KEY(true), patch)
    },
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      api.patch<Producto>(`/api/products/${id}/stock`, { delta }).then(r => r.data),
    onSuccess: (updated) => {
      const patch = (old: Producto[] | undefined) =>
        old ? old.map(p => (p.id === updated.id ? updated : p)) : [updated]
      qc.setQueryData<Producto[]>(KEY(), patch)
      qc.setQueryData<Producto[]>(KEY(false), patch)
      qc.setQueryData<Producto[]>(KEY(true), patch)
    },
  })
}
