import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style:    'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeZone:  'America/Bogota',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone:  'America/Bogota',
  }).format(new Date(date))
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('es-CO', {
    timeStyle: 'short',
    timeZone:  'America/Bogota',
  }).format(new Date(date))
}

export const ESTADO_CITA_LABELS: Record<string, string> = {
  PENDIENTE:   'Pendiente',
  CONFIRMADA:  'Confirmada',
  EN_PROCESO:  'En proceso',
  COMPLETADA:  'Completada',
  CANCELADA:   'Cancelada',
  NO_ASISTIO:  'No asistió',
}

export const ESTADO_CITA_COLORS: Record<string, string> = {
  PENDIENTE:   'bg-yellow-100 text-yellow-800',
  CONFIRMADA:  'bg-blue-100 text-blue-800',
  EN_PROCESO:  'bg-purple-100 text-purple-800',
  COMPLETADA:  'bg-green-100 text-green-800',
  CANCELADA:   'bg-red-100 text-red-800',
  NO_ASISTIO:  'bg-gray-100 text-gray-800',
}

