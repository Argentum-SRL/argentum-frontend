export interface CategoriaVisual {
  iconSrc: string
  label: string
}

export const CATEGORIA_VISUAL: Record<string, CategoriaVisual> = {
  // Alimentación
  'supermercado':     { iconSrc: '/src/assets/icons/categorias/supermercado Background Removed.png', label: 'Supermercado' },
  'alimentacion':     { iconSrc: '/src/assets/icons/categorias/alimentacion Background Removed.png', label: 'Alimentación' },
  'verduleria':       { iconSrc: '/src/assets/icons/categorias/zanahoria Background Removed.png',    label: 'Verdulería' },
  'restaurante':      { iconSrc: '/src/assets/icons/categorias/hamburguesa Background Removed.png',  label: 'Restaurante' },
  'delivery':         { iconSrc: '/src/assets/icons/categorias/hamburguesa Background Removed.png',  label: 'Delivery' },
  'cafeteria':        { iconSrc: '/src/assets/icons/categorias/cafe Background Removed.png',         label: 'Cafetería' },
  // Transporte
  'transporte':       { iconSrc: '/src/assets/icons/categorias/transporte Background Removed.png',   label: 'Transporte' },
  'combustible':      { iconSrc: '/src/assets/icons/categorias/auto Background Removed.png',         label: 'Combustible' },
  'taxi':             { iconSrc: '/src/assets/icons/categorias/auto2 Background Removed.png',        label: 'Taxi / Remis' },
  'viaje':            { iconSrc: '/src/assets/icons/categorias/avion Background Removed.png',        label: 'Viaje' },
  // Salud & Bienestar
  'salud':            { iconSrc: '/src/assets/icons/categorias/medicina Background Removed.png',     label: 'Salud' },
  'farmacia':         { iconSrc: '/src/assets/icons/categorias/medicina Background Removed.png',     label: 'Farmacia' },
  'medico':           { iconSrc: '/src/assets/icons/categorias/bienestar Background Removed.png',    label: 'Médico' },
  'obra social':      { iconSrc: '/src/assets/icons/categorias/bienestar Background Removed.png',    label: 'Obra Social' },
  'bienestar':        { iconSrc: '/src/assets/icons/categorias/bienestar Background Removed.png',    label: 'Bienestar' },
  'gimnasio':         { iconSrc: '/src/assets/icons/categorias/gym Background Removed.png',          label: 'Gimnasio' },
  // Entretenimiento
  'entretenimiento':  { iconSrc: '/src/assets/icons/categorias/entretenimiento Background Removed.png',label: 'Entretenimiento' },
  'entretenimiento y salidas': { iconSrc: '/src/assets/icons/categorias/entretenimiento Background Removed.png', label: 'Entretenimiento y salidas' },
  'streaming':        { iconSrc: '/src/assets/icons/categorias/peliculas Background Removed.png',    label: 'Streaming' },
  'cine':             { iconSrc: '/src/assets/icons/categorias/peliculas Background Removed.png',    label: 'Cine / Teatro' },
  'salidas':          { iconSrc: '/src/assets/icons/categorias/medialuna Background Removed.png',    label: 'Salidas' },
  // Servicios & Impuestos
  'servicios':        { iconSrc: '/src/assets/icons/categorias/luz Background Removed.png',          label: 'Servicios' },
  'servicios digitales': { iconSrc: '/src/assets/icons/categorias/serviciosdigitales Background Removed.png',       label: 'Servicios digitales' },
  'electricidad':     { iconSrc: '/src/assets/icons/categorias/luz Background Removed.png',          label: 'Electricidad' },
  'gas':              { iconSrc: '/src/assets/icons/categorias/luz Background Removed.png',          label: 'Gas' },
  'internet':         { iconSrc: '/src/assets/icons/categorias/luz Background Removed.png',          label: 'Internet' },
  'telefono':         { iconSrc: '/src/assets/icons/categorias/luz Background Removed.png',          label: 'Teléfono' },
  'impuestos':        { iconSrc: '/src/assets/icons/categorias/negocio Background Removed.png',      label: 'Impuestos' },
  // Ropa
  'ropa':             { iconSrc: '/src/assets/icons/categorias/remera Background Removed.png',       label: 'Ropa' },
  'indumentaria':     { iconSrc: '/src/assets/icons/categorias/remera Background Removed.png',       label: 'Indumentaria' },
  'ropa e indumentaria': { iconSrc: '/src/assets/icons/categorias/remera Background Removed.png',    label: 'Ropa e indumentaria' },
  // Educación
  'educacion':        { iconSrc: '/src/assets/icons/categorias/libros Background Removed.png',       label: 'Educación' },
  'cursos':           { iconSrc: '/src/assets/icons/categorias/libros Background Removed.png',       label: 'Cursos' },
  // Vivienda
  'vivienda':         { iconSrc: '/src/assets/icons/categorias/casa Background Removed.png',         label: 'Vivienda' },
  'alquiler':         { iconSrc: '/src/assets/icons/categorias/casa Background Removed.png',         label: 'Alquiler' },
  'expensas':         { iconSrc: '/src/assets/icons/categorias/casa Background Removed.png',         label: 'Expensas' },
  // Ingresos
  'sueldo':           { iconSrc: '/src/assets/icons/categorias/salario Background Removed.png',      label: 'Sueldo' },
  'freelance':        { iconSrc: '/src/assets/icons/categorias/maletin Background Removed.png',      label: 'Freelance' },
  'venta':            { iconSrc: '/src/assets/icons/categorias/promo Background Removed.png',        label: 'Venta' },
  'ingresos':         { iconSrc: '/src/assets/icons/categorias/salario Background Removed.png',      label: 'Ingresos' },
  'trabajo':          { iconSrc: '/src/assets/icons/categorias/maleta Background Removed.png',       label: 'Trabajo' },
  'trabajo en relacion de dependencia': { iconSrc: '/src/assets/icons/categorias/salario Background Removed.png', label: 'Trabajo en relación de dependencia' },
  'trabajo independiente': { iconSrc: '/src/assets/icons/categorias/trato Background Removed.png', label: 'Trabajo independiente' },
  'otros ingresos':   { iconSrc: '/src/assets/icons/categorias/dineroenmano Background Removed.png', label: 'Otros ingresos' },
  // Finanzas & Seguros
  'finanzas':         { iconSrc: '/src/assets/icons/categorias/banco Background Removed.png',        label: 'Finanzas' },
  'seguros':          { iconSrc: '/src/assets/icons/categorias/bienestar Background Removed.png',    label: 'Seguros' },
  // Otros
  'tecnologia':       { iconSrc: '/src/assets/icons/categorias/herramienta Background Removed.png',  label: 'Tecnología' },
  'mascota':          { iconSrc: '/src/assets/icons/categorias/mascota Background Removed.png',      label: 'Mascotas' },
  'mascotas':         { iconSrc: '/src/assets/icons/categorias/mascota Background Removed.png',      label: 'Mascotas' },
  'regalo':           { iconSrc: '/src/assets/icons/categorias/regalo Background Removed.png',       label: 'Regalos' },
  'regalos y donaciones': { iconSrc: '/src/assets/icons/categorias/regalo Background Removed.png',   label: 'Regalos y donaciones' },
  'ahorro':           { iconSrc: '/src/assets/icons/categorias/ahorro Background Removed.png',       label: 'Ahorro' },
  'tarjeta':          { iconSrc: '/src/assets/icons/categorias/tarjeta Background Removed.png',      label: 'Tarjeta' },
  'otros':            { iconSrc: '',                                                  label: 'Otros' },
  'default':          { iconSrc: '',                                                  label: 'Sin categoría' },
}

export function getCategoriaVisual(nombre?: string | null): CategoriaVisual {
  if (!nombre) return CATEGORIA_VISUAL['default']
  const key = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  return CATEGORIA_VISUAL[key] ?? CATEGORIA_VISUAL['default']
}
