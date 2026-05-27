export type RolUsuario = 'SUPER_ADMIN' | 'ADMIN' | 'BARBERO' | 'RECEPCIONISTA'
export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO'
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'NEQUI' | 'DAVIPLATA' | 'OTRO'
export type EstadoVenta = 'PENDIENTE' | 'PAGADA' | 'ANULADA' | 'REEMBOLSADA'
export type TipoItemVenta = 'SERVICIO' | 'PRODUCTO'

export interface Barberia {
  id:      string
  slug:    string
  nombre:  string
  logoUrl: string | null
  activo:  boolean
}

export interface User {
  id:         string
  nombre:     string
  apellido:   string | null
  email:      string
  rol:        RolUsuario
  barberiaId: string | null
  barberia:   Barberia | null
}

export interface Barbero {
  id:            string
  barberiaId:    string
  usuarioId:     string | null
  nombre:        string
  apellido:      string | null
  fotoUrl:       string | null
  telefono:      string | null
  email:         string | null
  bio:           string | null
  especialidades: string[]
  comisionPct:   number
  activo:        boolean
}

export interface Cliente {
  id:              string
  barberiaId:      string
  nombre:          string
  apellido:        string | null
  cedula:          string | null
  telefono:        string | null
  email:           string | null
  fechaNacimiento: string | null
  fotoUrl:         string | null
  notasEstilo:     string | null
  activo:          boolean
  createdAt:       string
  fechaRegistro:   string
  totalVisitas:    number
  totalGastado:    number
  ultimaVisita:    string | null
}

export interface Servicio {
  id:          string
  barberiaId:  string
  nombre:      string
  descripcion: string | null
  categoria:   string
  precio:      number
  duracionMin: number
  imagenUrl:   string | null
  activo:      boolean
}

export interface Producto {
  id:            string
  barberiaId:    string
  nombre:        string
  descripcion:   string | null
  categoria:     string
  precioVenta:   number
  precioCosto:   number
  stockActual:   number
  stockMinimo:   number
  stockMaximo:   number | null
  unidadMedida:  string
  codigoBarras:  string | null
  imagenUrl:     string | null
  activo:        boolean
  stockBajo:     boolean
}

export interface CitaServicio {
  id:          string
  servicioId:  string
  precio:      number
  duracionMin: number
  orden:       number
  servicio:    Pick<Servicio, 'id' | 'nombre'>
}

export interface Cita {
  id:                  string
  barberiaId:          string
  clienteId:           string
  barberoId:           string
  fechaHora:           string
  duracionMin:         number
  estado:              EstadoCita
  precioEstimado:      number | null
  notas:               string | null
  recordatorioEnviado: boolean
  createdAt:           string
  cliente:             Pick<Cliente, 'id' | 'nombre' | 'apellido' | 'telefono'>
  barbero:             Pick<Barbero, 'id' | 'nombre' | 'fotoUrl'>
  servicios:           CitaServicio[]
  venta:               Pick<Venta, 'id' | 'total' | 'estado'> | null
}

export interface ItemVenta {
  id:          string
  tipo:        TipoItemVenta
  servicioId:  string | null
  productoId:  string | null
  descripcion: string
  cantidad:    number
  precioUnit:  number
  descuento:   number
  subtotal:    number
  orden:       number
}

export interface Venta {
  id:          string
  barberiaId:  string
  citaId:      string | null
  clienteId:   string
  barberoId:   string
  fecha:       string
  subtotal:    number
  descuento:   number
  impuesto:    number
  total:       number
  metodoPago:  MetodoPago
  estado:      EstadoVenta
  notas:       string | null
  items:       ItemVenta[]
  cliente:     Pick<Cliente, 'id' | 'nombre' | 'apellido'>
  barbero:     Pick<Barbero, 'id' | 'nombre'>
}

export interface PaginatedResponse<T> {
  data:  T[]
  total: number
  page:  number
  limit: number
}

export interface ApiError {
  error:    string
  details?: unknown
}
