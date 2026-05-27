'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function DataPrefetcher() {
  const qc = useQueryClient()

  useEffect(() => {
    qc.prefetchQuery({ queryKey: ['barbers'],      queryFn: () => api.get('/api/barbers').then(r => r.data),  staleTime: 10 * 60 * 1000 })
    qc.prefetchQuery({ queryKey: ['services'],     queryFn: () => api.get('/api/services').then(r => r.data), staleTime: 10 * 60 * 1000 })
    qc.prefetchQuery({ queryKey: ['products', {}], queryFn: () => api.get('/api/products').then(r => r.data), staleTime:  2 * 60 * 1000 })
    qc.prefetchQuery({ queryKey: ['barberia'],     queryFn: () => api.get('/api/barberia').then(r => r.data), staleTime:  5 * 60 * 1000 })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
