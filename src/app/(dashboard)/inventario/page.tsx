'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, Plus, Package, Pencil, Loader2 } from 'lucide-react'
import { useProducts, useCreateProduct, useUpdateProduct, useAdjustStock } from '@/hooks/useProducts'
import { useToast } from '@/components/ui/use-toast'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Badge }    from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import type { Producto } from '@/types'

const productSchema = z.object({
  nombre:      z.string().min(2, 'Requerido'),
  categoria:   z.string().default('General'),
  precioVenta: z.coerce.number().positive('Precio requerido'),
  precioCosto: z.coerce.number().min(0).default(0),
  stockActual: z.coerce.number().int().min(0).default(0),
  stockMinimo: z.coerce.number().int().min(0).default(5),
})
type ProductFormData = z.infer<typeof productSchema>

export default function InventarioPage() {
  const { data: productos, isLoading } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const adjustStock   = useAdjustStock()
  const { toast }     = useToast()

  const [dialogOpen,    setDialogOpen]    = useState(false)
  const [editProduct,   setEditProduct]   = useState<Producto | null>(null)
  const [filterLowStock, setFilterLowStock] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  function openCreate() {
    setEditProduct(null)
    reset({ stockMinimo: 5, precioCosto: 0, stockActual: 0 })
    setDialogOpen(true)
  }

  function openEdit(prod: Producto) {
    setEditProduct(prod)
    reset({
      nombre:      prod.nombre,
      categoria:   prod.categoria,
      precioVenta: prod.precioVenta,
      precioCosto: prod.precioCosto,
      stockActual: prod.stockActual,
      stockMinimo: prod.stockMinimo,
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: ProductFormData) {
    try {
      if (editProduct) {
        await updateProduct.mutateAsync({ id: editProduct.id, ...data } as any)
        toast({ title: 'Producto actualizado' })
      } else {
        await createProduct.mutateAsync(data as any)
        toast({ title: 'Producto creado' })
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error ?? 'Error al guardar' })
    }
  }

  const filtered = filterLowStock
    ? (productos ?? []).filter(p => p.stockBajo)
    : (productos ?? [])

  const lowStockCount = (productos ?? []).filter(p => p.stockBajo).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Total productos</p>
          <p className="text-2xl font-bold">{(productos ?? []).length}</p>
        </div>
        <div className="stat-card border-yellow-500/30">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle size={11} className="text-yellow-400" />
            Stock bajo
          </p>
          <p className="text-2xl font-bold text-yellow-400">{lowStockCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setFilterLowStock(v => !v)}
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
            filterLowStock ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' : 'hover:bg-secondary'
          }`}
        >
          <AlertTriangle size={14} />
          Solo stock bajo
        </button>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" />
          Nuevo Producto
        </Button>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-40 rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(prod => (
            <ProductCard
              key={prod.id}
              producto={prod}
              onEdit={() => openEdit(prod)}
              onAdjust={delta => adjustStock.mutateAsync({ id: prod.id, delta })
                .then(() => toast({ title: 'Stock actualizado' }))
                .catch(() => toast({ variant: 'destructive', title: 'Error al ajustar stock' }))}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>{filterLowStock ? 'No hay productos con stock bajo' : 'Sin productos en inventario'}</p>
            </div>
          )}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre *</Label>
                <Input {...register('nombre')} placeholder="Pomada Matte" />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Input {...register('categoria')} placeholder="Estilizado" />
              </div>
              <div className="space-y-1.5">
                <Label>Precio venta *</Label>
                <Input type="number" min="0" {...register('precioVenta')} />
                {errors.precioVenta && <p className="text-xs text-destructive">{errors.precioVenta.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Precio costo</Label>
                <Input type="number" min="0" {...register('precioCosto')} />
              </div>
              <div className="space-y-1.5">
                <Label>Stock actual</Label>
                <Input type="number" min="0" {...register('stockActual')} />
              </div>
              <div className="space-y-1.5">
                <Label>Stock mínimo</Label>
                <Input type="number" min="0" {...register('stockMinimo')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {(createProduct.isPending || updateProduct.isPending) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {editProduct ? 'Guardar cambios' : 'Crear producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductCard({
  producto, onEdit, onAdjust,
}: {
  producto: Producto
  onEdit:   () => void
  onAdjust: (delta: number) => void
}) {
  return (
    <div className={`rounded-xl border bg-card p-4 space-y-3 ${producto.stockBajo ? 'border-yellow-500/40' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">{producto.nombre}</p>
          <p className="text-xs text-muted-foreground">{producto.categoria}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {producto.stockBajo && (
            <Badge variant="warning" className="text-[10px]">
              <AlertTriangle size={9} className="mr-1" />
              Bajo
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil size={13} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold">{formatCurrency(producto.precioVenta)}</p>
          <p className="text-xs text-muted-foreground">Costo: {formatCurrency(producto.precioCosto)}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAdjust(-1)}
              className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-secondary text-sm font-bold"
            >−</button>
            <span className={`text-lg font-bold w-8 text-center ${producto.stockBajo ? 'text-yellow-400' : ''}`}>
              {producto.stockActual}
            </span>
            <button
              onClick={() => onAdjust(1)}
              className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-secondary text-sm font-bold"
            >+</button>
          </div>
          <p className="text-xs text-muted-foreground text-center">mín. {producto.stockMinimo}</p>
        </div>
      </div>
    </div>
  )
}
