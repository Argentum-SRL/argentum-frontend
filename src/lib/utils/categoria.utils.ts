export interface CategoriaVisual {
  iconSrc: string
  label: string
}

export interface SubcategoriaVisual {
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
  'salud':            { iconSrc: '/src/assets/icons/categorias/medicina Background Removed.png',     label: 'Salud y cuidado personal' },
  'salud y cuidado personal': { iconSrc: '/src/assets/icons/categorias/medicina Background Removed.png', label: 'Salud y cuidado personal' },
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

export const SUBCATEGORIA_VISUAL: Record<string, SubcategoriaVisual> = {
  // Alimentación
  'supermercado': { iconSrc: '/src/assets/icons/categorias/supermercado Background Removed.png', label: 'Supermercado' },
  'verduleria':   { iconSrc: '/src/assets/icons/subcategorias/verduleria Background Removed.png', label: 'Verdulería' },
  'carniceria':   { iconSrc: '/src/assets/icons/subcategorias/carniceria Background Removed.png', label: 'Carnicería' },
  'polleria':     { iconSrc: '/src/assets/icons/subcategorias/polleria Background Removed.png', label: 'Pollería' },
  'panaderia':    { iconSrc: '/src/assets/icons/subcategorias/panaderia Background Removed.png', label: 'Panadería' },
  'pescaderia':   { iconSrc: '/src/assets/icons/subcategorias/pescaderia Background Removed.png', label: 'Pescadería' },
  'dietetica':    { iconSrc: '/src/assets/icons/subcategorias/dietetica Background Removed.png', label: 'Dietética' },
  'restaurante':  { iconSrc: '/src/assets/icons/subcategorias/restaurante Background Removed.png', label: 'Restaurante' },
  'delivery':     { iconSrc: '/src/assets/icons/subcategorias/delivery Background Removed.png', label: 'Delivery' },
  'cafeteria':    { iconSrc: '/src/assets/icons/subcategorias/cafeteria Background Removed.png', label: 'Cafetería' },
  'bar':          { iconSrc: '/src/assets/icons/subcategorias/bar Background Removed.png', label: 'Bar' },
  'heladeria':    { iconSrc: '/src/assets/icons/subcategorias/heladeria Background Removed.png', label: 'Heladería' },
  'general':      { iconSrc: '/src/assets/icons/subcategorias/alimentacion Background Removed.png', label: 'General' },
  
  // Transporte
  'transporte publico': { iconSrc: '/src/assets/icons/categorias/transporte Background Removed.png', label: 'Transporte público' },
  'taxi / remis':       { iconSrc: '/src/assets/icons/subcategorias/taxi Background Removed.png', label: 'Taxi / Remis' },
  'combustible':        { iconSrc: '/src/assets/icons/subcategorias/combustible Background Removed.png', label: 'Combustible' },
  'peaje':              { iconSrc: '/src/assets/icons/subcategorias/peaje Background Removed.png', label: 'Peaje' },
  'estacionamiento':    { iconSrc: '/src/assets/icons/subcategorias/estacionamiento Background Removed.png', label: 'Estacionamiento' },
  'mantenimiento del auto': { iconSrc: '/src/assets/icons/subcategorias/mecanico Background Removed.png', label: 'Mantenimiento' },
  'seguro del auto':    { iconSrc: '/src/assets/icons/subcategorias/seguro Background Removed.png', label: 'Seguro auto' },
  'bicicleta / patineta': { iconSrc: '/src/assets/icons/subcategorias/bicicleta Background Removed.png', label: 'Bici / Patineta' },
  
  // Salud
  'farmacia':           { iconSrc: '/src/assets/icons/subcategorias/farmacia Background Removed.png', label: 'Farmacia' },
  'medico / consulta':  { iconSrc: '/src/assets/icons/subcategorias/medicoconsulta Background Removed.png', label: 'Médico' },
  'obra social / prepaga': { iconSrc: '/src/assets/icons/subcategorias/mutualprepaga Background Removed.png', label: 'Prepaga' },
  'dentista':           { iconSrc: '/src/assets/icons/subcategorias/dentista Background Removed.png', label: 'Dentista' },
  'optica':             { iconSrc: '/src/assets/icons/subcategorias/optica Background Removed.png', label: 'Óptica' },
  'terapia':            { iconSrc: '/src/assets/icons/subcategorias/psicologia Background Removed.png', label: 'Terapia' },
  'kinesiologia':       { iconSrc: '/src/assets/icons/subcategorias/kinesiologia Background Removed.png', label: 'Kinesiología' },
  'estudios medicos':   { iconSrc: '/src/assets/icons/subcategorias/estudiosmedicos Background Removed.png', label: 'Estudios' },
  'gimnasio':           { iconSrc: '/src/assets/icons/subcategorias/gym Background Removed.png', label: 'Gimnasio' },
  'peluqueria':         { iconSrc: '/src/assets/icons/subcategorias/peluqueria Background Removed.png', label: 'Peluquería' },
  'spa / cuidado personal': { iconSrc: '/src/assets/icons/subcategorias/spa Background Removed.png', label: 'Spa' },

  // Educación
  'cuotas escolares / universitarias': { iconSrc: '/src/assets/icons/subcategorias/escuela Background Removed.png', label: 'Cuotas' },
  'cursos y capacitaciones':           { iconSrc: '/src/assets/icons/subcategorias/cursos Background Removed.png', label: 'Cursos' },
  'libros y materiales':               { iconSrc: '/src/assets/icons/subcategorias/libro Background Removed.png', label: 'Libros' },
  'idiomas':                           { iconSrc: '/src/assets/icons/subcategorias/idioma Background Removed.png', label: 'Idiomas' },
  'guarderia / jardin':                { iconSrc: '/src/assets/icons/subcategorias/guarderia Background Removed.png', label: 'Guardería' },

  // Vivienda
  'alquiler':           { iconSrc: '/src/assets/icons/subcategorias/alquiler Background Removed.png', label: 'Alquiler' },
  'expensas':           { iconSrc: '/src/assets/icons/subcategorias/expensas Background Removed.png', label: 'Expensas' },
  'electricidad':       { iconSrc: '/src/assets/icons/subcategorias/energialuz Background Removed.png', label: 'Electricidad' },
  'gas':                { iconSrc: '/src/assets/icons/subcategorias/gas Background Removed.png', label: 'Gas' },
  'agua':               { iconSrc: '/src/assets/icons/subcategorias/agua Background Removed.png', label: 'Agua' },
  'internet':           { iconSrc: '/src/assets/icons/subcategorias/internet Background Removed.png', label: 'Internet' },
  'telefono':          { iconSrc: '/src/assets/icons/subcategorias/telefono Background Removed.png', label: 'Teléfono' },
  'cable / tv':         { iconSrc: '/src/assets/icons/subcategorias/tv Background Removed.png', label: 'TV' },
  'limpieza':           { iconSrc: '/src/assets/icons/subcategorias/limpieza Background Removed.png', label: 'Limpieza' },
  'mantenimiento':      { iconSrc: '/src/assets/icons/subcategorias/mentenimiento Background Removed.png', label: 'Mantenimiento' },

  'default':      { iconSrc: '', label: '' }
}

export function getSubcategoriaVisual(nombre?: string | null): SubcategoriaVisual {
  if (!nombre) return SUBCATEGORIA_VISUAL['default']
  const key = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  return SUBCATEGORIA_VISUAL[key] ?? SUBCATEGORIA_VISUAL['default']
}
