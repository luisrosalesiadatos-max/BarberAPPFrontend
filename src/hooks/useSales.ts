import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Venta, PaginatedResponse } from '@/types'

interface CheckoutPayload {
  citaId?:    string | null
  clienteId:  string
  barberoId:  string
  items: {
    tipo:        string
    servicioId?: string | null
    productoId?: string | null
    descripcion: string
    cantidad:    number
    precioUnit:  number
    descuento?:  number
    orden?:      number
  }[]
  descuento:  number
  impuesto?:  number
  metodoPago: string
  notas?:     string | null
}

export function useSales(params?: { desde?: string; hasta?: string; barberoId?: string }) {
  return useQuery<PaginatedResponse<Venta>>({
    queryKey: ['sales', params],
    queryFn:  () => api.get('/api/sales', { params }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useCheckout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CheckoutPayload) =>
      api.post<Venta>('/api/sales', data).then(r => r.data),
    onSuccess: (nueva) => {
      // Agrega la venta nueva al inicio de la lista sin refetch completo
      qc.setQueriesData<PaginatedResponse<Venta>>(
        { queryKey: ['sales'], exact: false },
        (old) => old ? { ...old, data: [nueva, ...old.data], total: old.total + 1 } : old,
      )
      // Citas y clientes necesitan datos frescos después de un pago
      qc.invalidateQueries({ queryKey: ['appointments'], exact: false })
      qc.invalidateQueries({ queryKey: ['clients'],      exact: false })
      // Productos solo si la venta tenía productos
      if (nueva.items?.some((i: any) => i.tipo === 'PRODUCTO')) {
        qc.invalidateQueries({ queryKey: ['products'], exact: false })
      }
    },
  })
}
