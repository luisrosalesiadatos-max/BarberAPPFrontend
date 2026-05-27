import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Cita, PaginatedResponse } from '@/types'

interface AppointmentFilters {
  fecha?:     string
  barberoId?: string
  estado?:    string
  page?:      number
  limit?:     number
}

export function useAppointments(filters?: AppointmentFilters) {
  return useQuery<PaginatedResponse<Cita>>({
    queryKey: ['appointments', filters],
    queryFn:  () => api.get('/api/appointments', { params: filters }).then(r => r.data),
    staleTime: 60 * 1000,           // 1 min — agenda cambia frecuente
    placeholderData: (prev) => prev, // no muestra spinner al cambiar filtros
  })
}

export function useAppointment(id: string) {
  return useQuery<Cita>({
    queryKey: ['appointments', id],
    queryFn:  () => api.get(`/api/appointments/${id}`).then(r => r.data),
    enabled:  !!id,
    staleTime: 60 * 1000,
  })
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      api.post<Cita>('/api/appointments', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'], exact: false })
    },
  })
}

export function useUpdateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; estado?: string; notas?: string; precioFinal?: number }) =>
      api.patch<Cita>(`/api/appointments/${id}`, data).then(r => r.data),
    onSuccess: (updated) => {
      // Actualiza el detalle individual
      qc.setQueryData<Cita>(['appointments', updated.id], updated)
      // Actualiza dentro de todas las listas en cache
      qc.setQueriesData<PaginatedResponse<Cita>>(
        { queryKey: ['appointments'], exact: false },
        (old) =>
          old
            ? { ...old, data: old.data.map(c => (c.id === updated.id ? updated : c)) }
            : old,
      )
    },
  })
}
