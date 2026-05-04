export interface CategoriaVisual {
  iconSrc: string
  label: string
}

export const CATEGORIA_VISUAL: Record<string, CategoriaVisual> = {
  // Alimentación
  'supermercado':     { iconSrc: '/src/assets/icons/categorias/shopping.svg',        label: 'Supermercado' },
  'alimentacion':     { iconSrc: '/src/assets/icons/categorias/shopping.svg',        label: 'Alimentación' },
  'verduleria':       { iconSrc: '/src/assets/icons/categorias/zanahoria.svg',       label: 'Verdulería' },
  'restaurante':      { iconSrc: '/src/assets/icons/categorias/medialuna.svg',       label: 'Restaurante' },
  'delivery':         { iconSrc: '/src/assets/icons/categorias/medialuna.svg',       label: 'Delivery' },
  'cafeteria':        { iconSrc: '/src/assets/icons/categorias/cafe.svg',            label: 'Cafetería' },
  // Transporte
  'transporte':       { iconSrc: '/src/assets/icons/categorias/transporte.svg',      label: 'Transporte' },
  'combustible':      { iconSrc: '/src/assets/icons/categorias/auto.svg',            label: 'Combustible' },
  'taxi':             { iconSrc: '/src/assets/icons/categorias/auto.svg',            label: 'Taxi / Remis' },
  'viaje':            { iconSrc: '/src/assets/icons/categorias/avion.svg',           label: 'Viaje' },
  // Salud & Bienestar
  'salud':            { iconSrc: '/src/assets/icons/categorias/medicina.svg',        label: 'Salud' },
  'farmacia':         { iconSrc: '/src/assets/icons/categorias/medicina.svg',        label: 'Farmacia' },
  'medico':           { iconSrc: '/src/assets/icons/categorias/bienestar.svg',       label: 'Médico' },
  'obra social':      { iconSrc: '/src/assets/icons/categorias/bienestar.svg',       label: 'Obra Social' },
  'bienestar':        { iconSrc: '/src/assets/icons/categorias/bienestar.svg',       label: 'Bienestar' },
  'gimnasio':         { iconSrc: '/src/assets/icons/categorias/gym.svg',             label: 'Gimnasio' },
  // Entretenimiento
  'entretenimiento':  { iconSrc: '/src/assets/icons/categorias/entretenimiento.svg', label: 'Entretenimiento' },
  'streaming':        { iconSrc: '/src/assets/icons/categorias/peliculas.svg',       label: 'Streaming' },
  'cine':             { iconSrc: '/src/assets/icons/categorias/peliculas.svg',       label: 'Cine / Teatro' },
  'salidas':          { iconSrc: '/src/assets/icons/categorias/cafe.svg',            label: 'Salidas' },
  // Servicios & Impuestos
  'servicios':        { iconSrc: '/src/assets/icons/categorias/luz.svg',             label: 'Servicios' },
  'electricidad':     { iconSrc: '/src/assets/icons/categorias/luz.svg',             label: 'Electricidad' },
  'gas':              { iconSrc: '/src/assets/icons/categorias/luz.svg',             label: 'Gas' },
  'internet':         { iconSrc: '/src/assets/icons/categorias/luz.svg',             label: 'Internet' },
  'telefono':         { iconSrc: '/src/assets/icons/categorias/luz.svg',             label: 'Teléfono' },
  'impuestos':        { iconSrc: '/src/assets/icons/categorias/luz.svg',             label: 'Impuestos' },
  // Ropa
  'ropa':             { iconSrc: '/src/assets/icons/categorias/remera.svg',          label: 'Ropa' },
  'indumentaria':     { iconSrc: '/src/assets/icons/categorias/remera.svg',          label: 'Indumentaria' },
  'ropa e indumentaria': { iconSrc: '/src/assets/icons/categorias/remera.svg',       label: 'Ropa e indumentaria' },
  // Educación
  'educacion':        { iconSrc: '/src/assets/icons/categorias/libros.svg',          label: 'Educación' },
  'cursos':           { iconSrc: '/src/assets/icons/categorias/libros.svg',          label: 'Cursos' },
  // Vivienda
  'vivienda':         { iconSrc: '/src/assets/icons/categorias/casa.svg',            label: 'Vivienda' },
  'alquiler':         { iconSrc: '/src/assets/icons/categorias/casa.svg',            label: 'Alquiler' },
  'expensas':         { iconSrc: '/src/assets/icons/categorias/casa.svg',            label: 'Expensas' },
  // Ingresos
  'sueldo':           { iconSrc: '/src/assets/icons/categorias/salario.svg',          label: 'Sueldo' },
  'freelance':        { iconSrc: '/src/assets/icons/categorias/maletin.svg',         label: 'Freelance' },
  'venta':            { iconSrc: '/src/assets/icons/categorias/promo.svg',           label: 'Venta' },
  'ingresos':         { iconSrc: '/src/assets/icons/categorias/salario.svg',          label: 'Ingresos' },
  'trabajo':          { iconSrc: '/src/assets/icons/categorias/maletin.svg',         label: 'Trabajo' },
  // Finanzas & Seguros
  'finanzas':         { iconSrc: '/src/assets/icons/categorias/banco.svg',           label: 'Finanzas' },
  'seguros':          { iconSrc: '/src/assets/icons/categorias/bienestar.svg',       label: 'Seguros' },
  // Otros
  'tecnologia':       { iconSrc: '/src/assets/icons/categorias/herramienta.svg',     label: 'Tecnología' },
  'mascota':          { iconSrc: '/src/assets/icons/categorias/mascota.svg',         label: 'Mascotas' },
  'mascotas':         { iconSrc: '/src/assets/icons/categorias/mascota.svg',         label: 'Mascotas' },
  'regalo':           { iconSrc: '/src/assets/icons/categorias/regalo.svg',          label: 'Regalos' },
  'regalos y donaciones': { iconSrc: '/src/assets/icons/categorias/regalo.svg',      label: 'Regalos y donaciones' },
  'ahorro':           { iconSrc: '/src/assets/icons/categorias/ahorro.svg',          label: 'Ahorro' },
  'tarjeta':          { iconSrc: '/src/assets/icons/categorias/tarjeta.svg',         label: 'Tarjeta' },
  'otros':            { iconSrc: '',                                                  label: 'Otros' },
  'default':          { iconSrc: '',                                                  label: 'Sin categoría' },
}

export function getCategoriaVisual(nombre?: string | null): CategoriaVisual {
  if (!nombre) return CATEGORIA_VISUAL['default']
  const key = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  return CATEGORIA_VISUAL[key] ?? CATEGORIA_VISUAL['default']
}
