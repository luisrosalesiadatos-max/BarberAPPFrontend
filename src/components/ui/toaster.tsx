'use client'

import { useToast } from './use-toast'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.filter(t => t.open).map(toast => (
        <div
          key={toast.id}
          className={cn(
            'relative rounded-xl border p-4 shadow-lg animate-fade-in flex items-start gap-3',
            toast.variant === 'destructive'
              ? 'bg-destructive border-destructive/50 text-destructive-foreground'
              : 'bg-card border-border text-card-foreground',
          )}
        >
          <div className="flex-1 min-w-0">
            {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
            {toast.description && <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
