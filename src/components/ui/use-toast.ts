'use client'

import { useState, useEffect, useCallback } from 'react'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToastVariant = 'default' | 'destructive'

interface Toast {
  id:          string
  title?:      string
  description?: string
  variant?:    ToastVariant
  open:        boolean
}

type Action =
  | { type: 'ADD_TOAST';    toast: Toast }
  | { type: 'UPDATE_TOAST'; toast: Partial<Toast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST';  toastId?: string }

let count = 0
const genId = () => String(++count)

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

let listeners: Array<(state: Toast[]) => void> = []
let memoryState: Toast[] = []

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach(listener => listener(memoryState))
}

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case 'ADD_TOAST':
      return [action.toast, ...state].slice(0, TOAST_LIMIT)
    case 'UPDATE_TOAST':
      return state.map(t => t.id === action.toast.id ? { ...t, ...action.toast } : t)
    case 'DISMISS_TOAST': {
      const { toastId } = action
      if (toastId) {
        if (!toastTimeouts.has(toastId)) {
          toastTimeouts.set(toastId, setTimeout(() => {
            toastTimeouts.delete(toastId)
            dispatch({ type: 'REMOVE_TOAST', toastId })
          }, TOAST_REMOVE_DELAY))
        }
      } else {
        state.forEach(t => {
          if (!toastTimeouts.has(t.id)) {
            toastTimeouts.set(t.id, setTimeout(() => {
              toastTimeouts.delete(t.id)
              dispatch({ type: 'REMOVE_TOAST', toastId: t.id })
            }, TOAST_REMOVE_DELAY))
          }
        })
      }
      return state.map(t => (toastId === undefined || t.id === toastId) ? { ...t, open: false } : t)
    }
    case 'REMOVE_TOAST':
      return action.toastId ? state.filter(t => t.id !== action.toastId) : []
  }
}

export function toast(props: Omit<Toast, 'id' | 'open'>) {
  const id = genId()
  dispatch({ type: 'ADD_TOAST', toast: { ...props, id, open: true } })
  setTimeout(() => dispatch({ type: 'DISMISS_TOAST', toastId: id }), TOAST_REMOVE_DELAY)
  return { id, dismiss: () => dispatch({ type: 'DISMISS_TOAST', toastId: id }) }
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter(l => l !== setState)
    }
  }, [])

  return {
    toasts: state,
    toast,
    dismiss: useCallback((id?: string) => dispatch({ type: 'DISMISS_TOAST', toastId: id }), []),
  }
}
