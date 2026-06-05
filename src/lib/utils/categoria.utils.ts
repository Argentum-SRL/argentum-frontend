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
  'supermercado':     { iconSrc: '/assets/icons/categorias/supermercado%20Background%20Removed.png', label: 'Supermercado' },
  'alimentacion':     { iconSrc: '/assets/icons/categorias/alimentacion%20Background%20Removed.png', label: 'Alimentación' },
  'verduleria':       { iconSrc: '/assets/icons/categorias/zanahoria%20Background%20Removed.png',    label: 'Verdulería' },
  'restaurante':      { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Restaurante' },
  'delivery':         { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Delivery' },
  'cafeteria':        { iconSrc: '/assets/icons/categorias/cafe%20Background%20Removed.png',         label: 'Cafetería' },
  // Transporte
  'transporte':       { iconSrc: '/assets/icons/subcategorias/auto%20Background%20Removed.png',   label: 'Transporte' },
  'combustible':      { iconSrc: '/assets/icons/categorias/auto%20Background%20Removed.png',         label: 'Combustible' },
  'taxi':             { iconSrc: '/assets/icons/categorias/auto2%20Background%20Removed.png',        label: 'Taxi / Remis' },
  'viaje':            { iconSrc: '/assets/icons/categorias/avion%20Background%20Removed.png',        label: 'Viaje' },
  // Salud & Bienestar
  'salud':            { iconSrc: '/assets/icons/categorias/medicina%20Background%20Removed.png',     label: 'Salud y cuidado personal' },
  'salud y cuidado personal': { iconSrc: '/assets/icons/categorias/medicina%20Background%20Removed.png', label: 'Salud y cuidado personal' },
  'farmacia':         { iconSrc: '/assets/icons/categorias/medicina%20Background%20Removed.png',     label: 'Farmacia' },
  'medico':           { iconSrc: '/assets/icons/categorias/bienestar%20Background%20Removed.png',    label: 'Médico' },
  'obra social':      { iconSrc: '/assets/icons/categorias/bienestar%20Background%20Removed.png',    label: 'Obra Social' },
  'bienestar':        { iconSrc: '/assets/icons/categorias/bienestar%20Background%20Removed.png',    label: 'Bienestar' },
  'gimnasio':         { iconSrc: '/assets/icons/categorias/gym%20Background%20Removed.png',          label: 'Gimnasio' },
  // Entretenimiento
  'entretenimiento':  { iconSrc: '/assets/icons/categorias/entretenimiento%20Background%20Removed.png',label: 'Entretenimiento' },
  'entretenimiento y salidas': { iconSrc: '/assets/icons/categorias/entretenimiento%20Background%20Removed.png', label: 'Entretenimiento y salidas' },
  'streaming':        { iconSrc: '/assets/icons/categorias/peliculas%20Background%20Removed.png',    label: 'Streaming' },
  'cine':             { iconSrc: '/assets/icons/categorias/peliculas%20Background%20Removed.png',    label: 'Cine / Teatro' },
  'salidas':          { iconSrc: '/assets/icons/categorias/medialuna%20Background%20Removed.png',    label: 'Salidas' },
  // Banco
  'banco':            { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png',         label: 'Banco' },
  // Mascotas
  'mascotas':         { iconSrc: '/assets/icons/subcategorias/mascotas%20Background%20Removed.png',  label: 'Mascotas' },
  // Regalos
  'regalos':          { iconSrc: '/assets/icons/categorias/regalo%20Background%20Removed.png',         label: 'Regalos' },
  // Servicios & Impuestos
  'servicios':        { iconSrc: '/assets/icons/categorias/luz%20Background%20Removed.png',          label: 'Servicios' },
  'servicios digitales': { iconSrc: '/assets/icons/categorias/serviciosdigitales%20Background%20Removed.png',       label: 'Servicios digitales' },
  'electricidad':     { iconSrc: '/assets/icons/categorias/luz%20Background%20Removed.png',          label: 'Electricidad' },
  'gas':              { iconSrc: '/assets/icons/categorias/luz%20Background%20Removed.png',          label: 'Gas' },
  'internet':         { iconSrc: '/assets/icons/categorias/luz%20Background%20Removed.png',          label: 'Internet' },
  'telefono':         { iconSrc: '/assets/icons/categorias/luz%20Background%20Removed.png',          label: 'Teléfono' },
  'impuestos':        { iconSrc: '/assets/icons/categorias/negocio%20Background%20Removed.png',      label: 'Impuestos' },
  // Ropa
  'ropa':             { iconSrc: '/assets/icons/categorias/remera%20Background%20Removed.png',       label: 'Ropa' },
  'indumentaria':     { iconSrc: '/assets/icons/categorias/remera%20Background%20Removed.png',       label: 'Indumentaria' },
  'ropa e indumentaria': { iconSrc: '/assets/icons/categorias/remera%20Background%20Removed.png',    label: 'Ropa e indumentaria' },
  // Educación
  'educacion':        { iconSrc: '/assets/icons/categorias/libros%20Background%20Removed.png',       label: 'Educación' },
  'cursos':           { iconSrc: '/assets/icons/categorias/libros%20Background%20Removed.png',       label: 'Cursos' },
  // Vivienda
  'vivienda':         { iconSrc: '/assets/icons/categorias/casa%20Background%20Removed.png',         label: 'Vivienda' },
  'alquiler':         { iconSrc: '/assets/icons/categorias/casa%20Background%20Removed.png',         label: 'Alquiler' },
  'expensas':         { iconSrc: '/assets/icons/categorias/casa%20Background%20Removed.png',         label: 'Expensas' },
  // Ingresos
  'sueldo':           { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png',      label: 'Sueldo' },
  'freelance':        { iconSrc: '/assets/icons/categorias/maletin%20Background%20Removed.png',      label: 'Freelance' },
  'venta':            { iconSrc: '/assets/icons/categorias/promo%20Background%20Removed.png',        label: 'Venta' },
  'ingresos':         { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png',      label: 'Ingresos' },
  'trabajo':          { iconSrc: '/assets/icons/categorias/maleta%20Background%20Removed.png',       label: 'Trabajo' },
  'trabajo en relacion de dependencia': { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png', label: 'Trabajo en relación de dependencia' },
  'trabajo independiente': { iconSrc: '/assets/icons/categorias/trato%20Background%20Removed.png', label: 'Trabajo independiente' },
  'otros ingresos':   { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Otros ingresos' },
  // Finanzas & Seguros
  'finanzas':         { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png',        label: 'Finanzas' },
  'seguros':          { iconSrc: '/assets/icons/categorias/bienestar%20Background%20Removed.png',    label: 'Seguros' },
  // Otros
  'tecnologia':       { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png',  label: 'Tecnología' },
  'regalo':           { iconSrc: '/assets/icons/categorias/regalo%20Background%20Removed.png',       label: 'Regalos' },
  'regalos y donaciones': { iconSrc: '/assets/icons/categorias/regalo%20Background%20Removed.png',   label: 'Regalos y donaciones' },
  'ahorro':           { iconSrc: '/assets/icons/categorias/ahorro%20Background%20Removed.png',       label: 'Ahorro' },
  'tarjeta':          { iconSrc: '/assets/icons/categorias/tarjeta%20Background%20Removed.png',      label: 'Tarjeta' },
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
  'supermercado': { iconSrc: '/assets/icons/categorias/supermercado%20Background%20Removed.png', label: 'Supermercado' },
  'verduleria':   { iconSrc: '/assets/icons/subcategorias/verduleria%20Background%20Removed.png', label: 'Verdulería' },
  'carniceria':   { iconSrc: '/assets/icons/subcategorias/carniceria%20Background%20Removed.png', label: 'Carnicería' },
  'polleria':     { iconSrc: '/assets/icons/subcategorias/polleria%20Background%20Removed.png', label: 'Pollería' },
  'panaderia':    { iconSrc: '/assets/icons/subcategorias/panaderia%20Background%20Removed.png', label: 'Panadería' },
  'pescaderia':   { iconSrc: '/assets/icons/subcategorias/pescaderia%20Background%20Removed.png', label: 'Pescadería' },
  'dietetica':    { iconSrc: '/assets/icons/subcategorias/dietetica%20Background%20Removed.png', label: 'Dietética' },
  'restaurante':  { iconSrc: '/assets/icons/subcategorias/restaurante%20Background%20Removed.png', label: 'Restaurante' },
  'delivery':     { iconSrc: '/assets/icons/subcategorias/delivery%20Background%20Removed.png', label: 'Delivery' },
  'cafeteria':    { iconSrc: '/assets/icons/subcategorias/cafeteria%20Background%20Removed.png', label: 'Cafetería' },
  'bar':          { iconSrc: '/assets/icons/subcategorias/bar%20Background%20Removed.png', label: 'Bar' },
  'heladeria':    { iconSrc: '/assets/icons/subcategorias/heladeria%20Background%20Removed.png', label: 'Heladería' },
  'general':      { iconSrc: '/assets/icons/subcategorias/alimentacion%20Background%20Removed.png', label: 'General' },
  
  // Transporte
  'transporte publico': { iconSrc: '/assets/icons/categorias/transporte%20Background%20Removed.png', label: 'Transporte público' },
  'taxi / remis':       { iconSrc: '/assets/icons/subcategorias/taxi%20Background%20Removed.png', label: 'Taxi / Remis' },
  'combustible':        { iconSrc: '/assets/icons/subcategorias/combustible%20Background%20Removed.png', label: 'Combustible' },
  'peaje':              { iconSrc: '/assets/icons/subcategorias/peaje%20Background%20Removed.png', label: 'Peaje' },
  'estacionamiento':    { iconSrc: '/assets/icons/subcategorias/estacionamiento%20Background%20Removed.png', label: 'Estacionamiento' },
  'mantenimiento del auto': { iconSrc: '/assets/icons/subcategorias/mecanico%20Background%20Removed.png', label: 'Mantenimiento' },
  'seguro del auto':    { iconSrc: '/assets/icons/subcategorias/seguro%20Background%20Removed.png', label: 'Seguro auto' },
  'bicicleta / patineta': { iconSrc: '/assets/icons/subcategorias/bicicleta%20Background%20Removed.png', label: 'Bici / Patineta' },
  
  // Salud
  'farmacia':           { iconSrc: '/assets/icons/subcategorias/farmacia%20Background%20Removed.png', label: 'Farmacia' },
  'medico / consulta':  { iconSrc: '/assets/icons/subcategorias/medicoconsulta%20Background%20Removed.png', label: 'Médico' },
  'obra social / prepaga': { iconSrc: '/assets/icons/subcategorias/mutualprepaga%20Background%20Removed.png', label: 'Prepaga' },
  'dentista':           { iconSrc: '/assets/icons/subcategorias/dentista%20Background%20Removed.png', label: 'Dentista' },
  'optica':             { iconSrc: '/assets/icons/subcategorias/optica%20Background%20Removed.png', label: 'Óptica' },
  'terapia':            { iconSrc: '/assets/icons/subcategorias/psicologia%20Background%20Removed.png', label: 'Terapia' },
  'kinesiologia':       { iconSrc: '/assets/icons/subcategorias/kinesiologia%20Background%20Removed.png', label: 'Kinesiología' },
  'estudios medicos':   { iconSrc: '/assets/icons/subcategorias/estudiosmedicos%20Background%20Removed.png', label: 'Estudios' },
  'gimnasio':           { iconSrc: '/assets/icons/subcategorias/gym%20Background%20Removed.png', label: 'Gimnasio' },
  'peluqueria':         { iconSrc: '/assets/icons/subcategorias/peluqueria%20Background%20Removed.png', label: 'Peluquería' },
  'spa / cuidado personal': { iconSrc: '/assets/icons/subcategorias/spa%20Background%20Removed.png', label: 'Spa' },

  // Educación
  'cuotas escolares / universitarias': { iconSrc: '/assets/icons/subcategorias/escuela%20Background%20Removed.png', label: 'Cuotas' },
  'cursos y capacitaciones':           { iconSrc: '/assets/icons/subcategorias/cursos%20Background%20Removed.png', label: 'Cursos' },
  'libros y materiales':               { iconSrc: '/assets/icons/subcategorias/libro%20Background%20Removed.png', label: 'Libros' },
  'idiomas':                           { iconSrc: '/assets/icons/subcategorias/idioma%20Background%20Removed.png', label: 'Idiomas' },
  'guarderia / jardin':                { iconSrc: '/assets/icons/subcategorias/guarderia%20Background%20Removed.png', label: 'Guardería' },

  // Vivienda
  'alquiler':           { iconSrc: '/assets/icons/subcategorias/alquiler%20Background%20Removed.png', label: 'Alquiler' },
  'expensas':           { iconSrc: '/assets/icons/subcategorias/expensas%20Background%20Removed.png', label: 'Expensas' },
  'electricidad':       { iconSrc: '/assets/icons/subcategorias/energialuz%20Background%20Removed.png', label: 'Electricidad' },
  'gas':                { iconSrc: '/assets/icons/subcategorias/gas%20Background%20Removed.png', label: 'Gas' },
  'agua':               { iconSrc: '/assets/icons/subcategorias/agua%20Background%20Removed.png', label: 'Agua' },
  'internet':           { iconSrc: '/assets/icons/subcategorias/internet%20Background%20Removed.png', label: 'Internet' },
  'telefono':          { iconSrc: '/assets/icons/subcategorias/telefono%20Background%20Removed.png', label: 'Teléfono' },
  'cable / tv':         { iconSrc: '/assets/icons/subcategorias/tv%20Background%20Removed.png', label: 'TV' },
  'limpieza':           { iconSrc: '/assets/icons/subcategorias/limpieza%20Background%20Removed.png', label: 'Limpieza' },
  'mantenimiento':      { iconSrc: '/assets/icons/subcategorias/mentenimiento%20Background%20Removed.png', label: 'Mantenimiento' },

  // Ropa e indumentaria
  'ropa':               { iconSrc: '/assets/icons/subcategorias/comprasropa%20Background%20Removed.png', label: 'Ropa' },
  'calzado':            { iconSrc: '/assets/icons/subcategorias/zapatillas%20Background%20Removed.png', label: 'Calzado' },
  'accesorios':         { iconSrc: '/assets/icons/subcategorias/accesorios%20Background%20Removed.png', label: 'Accesorios' },
  'ropa deportiva':     { iconSrc: '/assets/icons/subcategorias/ropadeportiva%20Background%20Removed.png', label: 'Deportiva' },

  // Entretenimiento y salidas
  'cine / teatro / recitales': { iconSrc: '/assets/icons/subcategorias/peliculasycine%20Background%20Removed.png', label: 'Cine/Teatro' },
  'salidas con amigos': { iconSrc: '/assets/icons/subcategorias/fiesta%20Background%20Removed.png', label: 'Salidas' },
  'vacaciones y viajes':{ iconSrc: '/assets/icons/subcategorias/vacaciones%20Background%20Removed.png', label: 'Vacaciones' },
  'hobbies':            { iconSrc: '/assets/icons/subcategorias/hobbies%20Background%20Removed.png', label: 'Hobbies' },
  'juegos y videojuegos':{ iconSrc: '/assets/icons/subcategorias/juegos%20Background%20Removed.png', label: 'Juegos' },
  'deportes':           { iconSrc: '/assets/icons/subcategorias/deportes%20Background%20Removed.png', label: 'Deportes' },

  // Otros
  'alimento':           { iconSrc: '/assets/icons/subcategorias/mascotas%20Background%20Removed.png', label: 'Alimento' },
  'veterinario':        { iconSrc: '/assets/icons/subcategorias/mascotas%20Background%20Removed.png', label: 'Veterinario' },
  'impuestos':          { iconSrc: '/assets/icons/subcategorias/impuestos%20Background%20Removed.png', label: 'Impuestos' },

  'regalos':            { iconSrc: '/assets/icons/subcategorias/alimentacion%20Background%20Removed.png', label: 'Regalos' },
  
  // Banco
  'tarjeta de credito': { iconSrc: '/assets/icons/subcategorias/tarjeta%20Background%20Removed.png', label: 'Tarjeta' },
  'prestamos':          { iconSrc: '/assets/icons/subcategorias/prestamos%20Background%20Removed.png', label: 'Préstamos' },
  'inversiones':        { iconSrc: '/assets/icons/subcategorias/inversiones%20Background%20Removed.png', label: 'Inversiones' },
  'ahorros':            { iconSrc: '/assets/icons/subcategorias/ahorro%20Background%20Removed.png', label: 'Ahorros' },

  'default':      { iconSrc: '', label: '' }
}

export function getSubcategoriaVisual(nombre?: string | null): SubcategoriaVisual {
  if (!nombre) return SUBCATEGORIA_VISUAL['default']
  const key = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  return SUBCATEGORIA_VISUAL[key] ?? SUBCATEGORIA_VISUAL['default']
}
