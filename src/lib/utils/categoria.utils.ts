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
  'supermercado':     { iconSrc: '/assets/icons/categorias/supermercado Background Removed.png', label: 'Supermercado' },
  'alimentacion':     { iconSrc: '/assets/icons/categorias/alimentacion Background Removed.png', label: 'Alimentación' },
  'verduleria':       { iconSrc: '/assets/icons/categorias/zanahoria Background Removed.png',    label: 'Verdulería' },
  'restaurante':      { iconSrc: '/assets/icons/categorias/hamburguesa Background Removed.png',  label: 'Restaurante' },
  'delivery':         { iconSrc: '/assets/icons/categorias/hamburguesa Background Removed.png',  label: 'Delivery' },
  'cafeteria':        { iconSrc: '/assets/icons/categorias/cafe Background Removed.png',         label: 'Cafetería' },
  // Transporte
  'transporte':       { iconSrc: '/assets/icons/subcategorias/auto Background Removed.png',   label: 'Transporte' },
  'combustible':      { iconSrc: '/assets/icons/categorias/auto Background Removed.png',         label: 'Combustible' },
  'taxi':             { iconSrc: '/assets/icons/categorias/auto2 Background Removed.png',        label: 'Taxi / Remis' },
  'viaje':            { iconSrc: '/assets/icons/categorias/avion Background Removed.png',        label: 'Viaje' },
  // Salud & Bienestar
  'salud':            { iconSrc: '/assets/icons/categorias/medicina Background Removed.png',     label: 'Salud y cuidado personal' },
  'salud y cuidado personal': { iconSrc: '/assets/icons/categorias/medicina Background Removed.png', label: 'Salud y cuidado personal' },
  'farmacia':         { iconSrc: '/assets/icons/categorias/medicina Background Removed.png',     label: 'Farmacia' },
  'medico':           { iconSrc: '/assets/icons/categorias/bienestar Background Removed.png',    label: 'Médico' },
  'obra social':      { iconSrc: '/assets/icons/categorias/bienestar Background Removed.png',    label: 'Obra Social' },
  'bienestar':        { iconSrc: '/assets/icons/categorias/bienestar Background Removed.png',    label: 'Bienestar' },
  'gimnasio':         { iconSrc: '/assets/icons/categorias/gym Background Removed.png',          label: 'Gimnasio' },
  // Entretenimiento
  'entretenimiento':  { iconSrc: '/assets/icons/categorias/entretenimiento Background Removed.png',label: 'Entretenimiento' },
  'entretenimiento y salidas': { iconSrc: '/assets/icons/categorias/entretenimiento Background Removed.png', label: 'Entretenimiento y salidas' },
  'streaming':        { iconSrc: '/assets/icons/categorias/peliculas Background Removed.png',    label: 'Streaming' },
  'cine':             { iconSrc: '/assets/icons/categorias/peliculas Background Removed.png',    label: 'Cine / Teatro' },
  'salidas':          { iconSrc: '/assets/icons/categorias/medialuna Background Removed.png',    label: 'Salidas' },
  // Banco
  'banco':            { iconSrc: '/assets/icons/categorias/banco Background Removed.png',         label: 'Banco' },
  // Mascotas
  'mascotas':         { iconSrc: '/assets/icons/subcategorias/mascotas Background Removed.png',  label: 'Mascotas' },
  // Regalos
  'regalos':          { iconSrc: '/assets/icons/categorias/regalo Background Removed.png',         label: 'Regalos' },
  // Servicios & Impuestos
  'servicios':        { iconSrc: '/assets/icons/categorias/luz Background Removed.png',          label: 'Servicios' },
  'servicios digitales': { iconSrc: '/assets/icons/categorias/serviciosdigitales Background Removed.png',       label: 'Servicios digitales' },
  'electricidad':     { iconSrc: '/assets/icons/categorias/luz Background Removed.png',          label: 'Electricidad' },
  'gas':              { iconSrc: '/assets/icons/categorias/luz Background Removed.png',          label: 'Gas' },
  'internet':         { iconSrc: '/assets/icons/categorias/luz Background Removed.png',          label: 'Internet' },
  'telefono':         { iconSrc: '/assets/icons/categorias/luz Background Removed.png',          label: 'Teléfono' },
  'impuestos':        { iconSrc: '/assets/icons/categorias/negocio Background Removed.png',      label: 'Impuestos' },
  // Ropa
  'ropa':             { iconSrc: '/assets/icons/categorias/remera Background Removed.png',       label: 'Ropa' },
  'indumentaria':     { iconSrc: '/assets/icons/categorias/remera Background Removed.png',       label: 'Indumentaria' },
  'ropa e indumentaria': { iconSrc: '/assets/icons/categorias/remera Background Removed.png',    label: 'Ropa e indumentaria' },
  // Educación
  'educacion':        { iconSrc: '/assets/icons/categorias/libros Background Removed.png',       label: 'Educación' },
  'cursos':           { iconSrc: '/assets/icons/categorias/libros Background Removed.png',       label: 'Cursos' },
  // Vivienda
  'vivienda':         { iconSrc: '/assets/icons/categorias/casa Background Removed.png',         label: 'Vivienda' },
  'alquiler':         { iconSrc: '/assets/icons/categorias/casa Background Removed.png',         label: 'Alquiler' },
  'expensas':         { iconSrc: '/assets/icons/categorias/casa Background Removed.png',         label: 'Expensas' },
  // Ingresos
  'sueldo':           { iconSrc: '/assets/icons/categorias/salario Background Removed.png',      label: 'Sueldo' },
  'freelance':        { iconSrc: '/assets/icons/categorias/maletin Background Removed.png',      label: 'Freelance' },
  'venta':            { iconSrc: '/assets/icons/categorias/promo Background Removed.png',        label: 'Venta' },
  'ingresos':         { iconSrc: '/assets/icons/categorias/salario Background Removed.png',      label: 'Ingresos' },
  'trabajo':          { iconSrc: '/assets/icons/categorias/maleta Background Removed.png',       label: 'Trabajo' },
  'trabajo en relacion de dependencia': { iconSrc: '/assets/icons/categorias/salario Background Removed.png', label: 'Trabajo en relación de dependencia' },
  'trabajo independiente': { iconSrc: '/assets/icons/categorias/trato Background Removed.png', label: 'Trabajo independiente' },
  'otros ingresos':   { iconSrc: '/assets/icons/categorias/dineroenmano Background Removed.png', label: 'Otros ingresos' },
  // Finanzas & Seguros
  'finanzas':         { iconSrc: '/assets/icons/categorias/banco Background Removed.png',        label: 'Finanzas' },
  'seguros':          { iconSrc: '/assets/icons/categorias/bienestar Background Removed.png',    label: 'Seguros' },
  // Otros
  'tecnologia':       { iconSrc: '/assets/icons/categorias/herramienta Background Removed.png',  label: 'Tecnología' },
  'regalo':           { iconSrc: '/assets/icons/categorias/regalo Background Removed.png',       label: 'Regalos' },
  'regalos y donaciones': { iconSrc: '/assets/icons/categorias/regalo Background Removed.png',   label: 'Regalos y donaciones' },
  'ahorro':           { iconSrc: '/assets/icons/categorias/ahorro Background Removed.png',       label: 'Ahorro' },
  'tarjeta':          { iconSrc: '/assets/icons/categorias/tarjeta Background Removed.png',      label: 'Tarjeta' },
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
  'supermercado': { iconSrc: '/assets/icons/categorias/supermercado Background Removed.png', label: 'Supermercado' },
  'verduleria':   { iconSrc: '/assets/icons/subcategorias/verduleria Background Removed.png', label: 'Verdulería' },
  'carniceria':   { iconSrc: '/assets/icons/subcategorias/carniceria Background Removed.png', label: 'Carnicería' },
  'polleria':     { iconSrc: '/assets/icons/subcategorias/polleria Background Removed.png', label: 'Pollería' },
  'panaderia':    { iconSrc: '/assets/icons/subcategorias/panaderia Background Removed.png', label: 'Panadería' },
  'pescaderia':   { iconSrc: '/assets/icons/subcategorias/pescaderia Background Removed.png', label: 'Pescadería' },
  'dietetica':    { iconSrc: '/assets/icons/subcategorias/dietetica Background Removed.png', label: 'Dietética' },
  'restaurante':  { iconSrc: '/assets/icons/subcategorias/restaurante Background Removed.png', label: 'Restaurante' },
  'delivery':     { iconSrc: '/assets/icons/subcategorias/delivery Background Removed.png', label: 'Delivery' },
  'cafeteria':    { iconSrc: '/assets/icons/subcategorias/cafeteria Background Removed.png', label: 'Cafetería' },
  'bar':          { iconSrc: '/assets/icons/subcategorias/bar Background Removed.png', label: 'Bar' },
  'heladeria':    { iconSrc: '/assets/icons/subcategorias/heladeria Background Removed.png', label: 'Heladería' },
  'general':      { iconSrc: '/assets/icons/subcategorias/alimentacion Background Removed.png', label: 'General' },
  
  // Transporte
  'transporte publico': { iconSrc: '/assets/icons/categorias/transporte Background Removed.png', label: 'Transporte público' },
  'taxi / remis':       { iconSrc: '/assets/icons/subcategorias/taxi Background Removed.png', label: 'Taxi / Remis' },
  'combustible':        { iconSrc: '/assets/icons/subcategorias/combustible Background Removed.png', label: 'Combustible' },
  'peaje':              { iconSrc: '/assets/icons/subcategorias/peaje Background Removed.png', label: 'Peaje' },
  'estacionamiento':    { iconSrc: '/assets/icons/subcategorias/estacionamiento Background Removed.png', label: 'Estacionamiento' },
  'mantenimiento del auto': { iconSrc: '/assets/icons/subcategorias/mecanico Background Removed.png', label: 'Mantenimiento' },
  'seguro del auto':    { iconSrc: '/assets/icons/subcategorias/seguro Background Removed.png', label: 'Seguro auto' },
  'bicicleta / patineta': { iconSrc: '/assets/icons/subcategorias/bicicleta Background Removed.png', label: 'Bici / Patineta' },
  
  // Salud
  'farmacia':           { iconSrc: '/assets/icons/subcategorias/farmacia Background Removed.png', label: 'Farmacia' },
  'medico / consulta':  { iconSrc: '/assets/icons/subcategorias/medicoconsulta Background Removed.png', label: 'Médico' },
  'obra social / prepaga': { iconSrc: '/assets/icons/subcategorias/mutualprepaga Background Removed.png', label: 'Prepaga' },
  'dentista':           { iconSrc: '/assets/icons/subcategorias/dentista Background Removed.png', label: 'Dentista' },
  'optica':             { iconSrc: '/assets/icons/subcategorias/optica Background Removed.png', label: 'Óptica' },
  'terapia':            { iconSrc: '/assets/icons/subcategorias/psicologia Background Removed.png', label: 'Terapia' },
  'kinesiologia':       { iconSrc: '/assets/icons/subcategorias/kinesiologia Background Removed.png', label: 'Kinesiología' },
  'estudios medicos':   { iconSrc: '/assets/icons/subcategorias/estudiosmedicos Background Removed.png', label: 'Estudios' },
  'gimnasio':           { iconSrc: '/assets/icons/subcategorias/gym Background Removed.png', label: 'Gimnasio' },
  'peluqueria':         { iconSrc: '/assets/icons/subcategorias/peluqueria Background Removed.png', label: 'Peluquería' },
  'spa / cuidado personal': { iconSrc: '/assets/icons/subcategorias/spa Background Removed.png', label: 'Spa' },

  // Educación
  'cuotas escolares / universitarias': { iconSrc: '/assets/icons/subcategorias/escuela Background Removed.png', label: 'Cuotas' },
  'cursos y capacitaciones':           { iconSrc: '/assets/icons/subcategorias/cursos Background Removed.png', label: 'Cursos' },
  'libros y materiales':               { iconSrc: '/assets/icons/subcategorias/libro Background Removed.png', label: 'Libros' },
  'idiomas':                           { iconSrc: '/assets/icons/subcategorias/idioma Background Removed.png', label: 'Idiomas' },
  'guarderia / jardin':                { iconSrc: '/assets/icons/subcategorias/guarderia Background Removed.png', label: 'Guardería' },

  // Vivienda
  'alquiler':           { iconSrc: '/assets/icons/subcategorias/alquiler Background Removed.png', label: 'Alquiler' },
  'expensas':           { iconSrc: '/assets/icons/subcategorias/expensas Background Removed.png', label: 'Expensas' },
  'electricidad':       { iconSrc: '/assets/icons/subcategorias/energialuz Background Removed.png', label: 'Electricidad' },
  'gas':                { iconSrc: '/assets/icons/subcategorias/gas Background Removed.png', label: 'Gas' },
  'agua':               { iconSrc: '/assets/icons/subcategorias/agua Background Removed.png', label: 'Agua' },
  'internet':           { iconSrc: '/assets/icons/subcategorias/internet Background Removed.png', label: 'Internet' },
  'telefono':          { iconSrc: '/assets/icons/subcategorias/telefono Background Removed.png', label: 'Teléfono' },
  'cable / tv':         { iconSrc: '/assets/icons/subcategorias/tv Background Removed.png', label: 'TV' },
  'limpieza':           { iconSrc: '/assets/icons/subcategorias/limpieza Background Removed.png', label: 'Limpieza' },
  'mantenimiento':      { iconSrc: '/assets/icons/subcategorias/mentenimiento Background Removed.png', label: 'Mantenimiento' },

  // Ropa e indumentaria
  'ropa':               { iconSrc: '/assets/icons/subcategorias/comprasropa Background Removed.png', label: 'Ropa' },
  'calzado':            { iconSrc: '/assets/icons/subcategorias/zapatillas Background Removed.png', label: 'Calzado' },
  'accesorios':         { iconSrc: '/assets/icons/subcategorias/accesorios Background Removed.png', label: 'Accesorios' },
  'ropa deportiva':     { iconSrc: '/assets/icons/subcategorias/ropadeportiva Background Removed.png', label: 'Deportiva' },

  // Entretenimiento y salidas
  'cine / teatro / recitales': { iconSrc: '/assets/icons/subcategorias/peliculasycine Background Removed.png', label: 'Cine/Teatro' },
  'salidas con amigos': { iconSrc: '/assets/icons/subcategorias/fiesta Background Removed.png', label: 'Salidas' },
  'vacaciones y viajes':{ iconSrc: '/assets/icons/subcategorias/vacaciones Background Removed.png', label: 'Vacaciones' },
  'hobbies':            { iconSrc: '/assets/icons/subcategorias/hobbies Background Removed.png', label: 'Hobbies' },
  'juegos y videojuegos':{ iconSrc: '/assets/icons/subcategorias/juegos Background Removed.png', label: 'Juegos' },
  'deportes':           { iconSrc: '/assets/icons/subcategorias/deportes Background Removed.png', label: 'Deportes' },

  // Otros
  'alimento':           { iconSrc: '/assets/icons/subcategorias/mascotas Background Removed.png', label: 'Alimento' },
  'veterinario':        { iconSrc: '/assets/icons/subcategorias/mascotas Background Removed.png', label: 'Veterinario' },
  'impuestos':          { iconSrc: '/assets/icons/subcategorias/impuestos Background Removed.png', label: 'Impuestos' },

  'regalos':            { iconSrc: '/assets/icons/subcategorias/alimentacion Background Removed.png', label: 'Regalos' },
  
  // Banco
  'tarjeta de credito': { iconSrc: '/assets/icons/subcategorias/tarjeta Background Removed.png', label: 'Tarjeta' },
  'prestamos':          { iconSrc: '/assets/icons/subcategorias/prestamos Background Removed.png', label: 'Préstamos' },
  'inversiones':        { iconSrc: '/assets/icons/subcategorias/inversiones Background Removed.png', label: 'Inversiones' },
  'ahorros':            { iconSrc: '/assets/icons/subcategorias/ahorro Background Removed.png', label: 'Ahorros' },

  'default':      { iconSrc: '', label: '' }
}

export function getSubcategoriaVisual(nombre?: string | null): SubcategoriaVisual {
  if (!nombre) return SUBCATEGORIA_VISUAL['default']
  const key = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  return SUBCATEGORIA_VISUAL[key] ?? SUBCATEGORIA_VISUAL['default']
}
