export interface CategoriaVisual {
  iconSrc: string
  label: string
}

export interface SubcategoriaVisual {
  iconSrc: string
  label: string
}

export const CATEGORIA_VISUAL: Record<string, CategoriaVisual> = {
  // 12 Categorías de Gasto (Egreso)
  'alimentacion':             { iconSrc: '/assets/icons/categorias/alimentacion%20Background%20Removed.png', label: 'Alimentación' },
  'indumentaria':             { iconSrc: '/assets/icons/categorias/remera%20Background%20Removed.png',       label: 'Indumentaria' },
  'ropa':                     { iconSrc: '/assets/icons/categorias/remera%20Background%20Removed.png',       label: 'Indumentaria' },
  'ropa e indumentaria':      { iconSrc: '/assets/icons/categorias/remera%20Background%20Removed.png',       label: 'Indumentaria' },
  'servicios':                { iconSrc: '/assets/icons/categorias/luz%20Background%20Removed.png',          label: 'Servicios' },
  'hogar':                    { iconSrc: '/assets/icons/categorias/casa%20Background%20Removed.png',         label: 'Hogar' },
  'vivienda':                 { iconSrc: '/assets/icons/categorias/casa%20Background%20Removed.png',         label: 'Hogar' },
  'salud':                    { iconSrc: '/assets/icons/categorias/medicina%20Background%20Removed.png',     label: 'Salud' },
  'salud y cuidado personal': { iconSrc: '/assets/icons/categorias/medicina%20Background%20Removed.png',     label: 'Salud' },
  'transporte':               { iconSrc: '/assets/icons/categorias/transporte%20Background%20Removed.png',   label: 'Transporte' },
  'comunicacion':             { iconSrc: '/assets/icons/subcategorias/internet%20Background%20Removed.png', label: 'Comunicación' },
  'entretenimiento':          { iconSrc: '/assets/icons/categorias/entretenimiento%20Background%20Removed.png',    label: 'Entretenimiento' },
  'entretenimiento y salidas':{ iconSrc: '/assets/icons/categorias/entretenimiento%20Background%20Removed.png',    label: 'Entretenimiento' },
  'recreativo':               { iconSrc: '/assets/icons/categorias/entretenimiento%20Background%20Removed.png',    label: 'Entretenimiento' },
  'educacion':                { iconSrc: '/assets/icons/categorias/libros%20Background%20Removed.png',       label: 'Educación' },
  'restaurante':              { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Restaurante' },
  'restaurantes':             { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Restaurante' },
  'restaurantes y delivery':  { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Restaurante' },
  'otros':                    { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png',  label: 'Otros' },
  'otros gastos':             { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png',  label: 'Otros' },
  'ahorro':                   { iconSrc: '/assets/icons/categorias/ahorro%20Background%20Removed.png',       label: 'Ahorro' },
  'banco':                    { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png',        label: 'Banco' },

  'servicios digitales':      { iconSrc: '/assets/icons/categorias/serviciosdigitales%20Background%20Removed.png', label: 'Servicios digitales' },
  'gastos bancarios y comisiones': { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png', label: 'Gastos bancarios' },
  'gastos bancarios':         { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png',        label: 'Gastos bancarios' },
  'comida afuera':            { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Comida afuera' },
  'ingresos':                 { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Ingresos' },

  // 4 Categorías de Ingreso
  'empleo':                   { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png',      label: 'Empleo' },
  'sueldo':                   { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png',      label: 'Empleo' },
  'trabajo en relacion de dependencia': { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png', label: 'Empleo' },
  'trabajo independiente':    { iconSrc: '/assets/icons/categorias/trato%20Background%20Removed.png',        label: 'Trabajo independiente' },
  'inversiones y rentas':     { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Inversiones y rentas' },
  'otros ingresos':           { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Otros' },

  // Fallback
  'default':                  { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png',  label: 'Sin categoría' },
}

export function getCategoriaVisual(nombre?: string | null): CategoriaVisual {
  if (!nombre) return CATEGORIA_VISUAL['default']
  const key = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  return CATEGORIA_VISUAL[key] ?? CATEGORIA_VISUAL['default']
}

export const SUBCATEGORIA_VISUAL: Record<string, SubcategoriaVisual> = {
  // Alimentación
  'supermercado':             { iconSrc: '/assets/icons/categorias/supermercado%20Background%20Removed.png', label: 'Supermercado' },
  'verduleria':               { iconSrc: '/assets/icons/subcategorias/verduleria%20Background%20Removed.png', label: 'Verdulería' },
  'carniceria':               { iconSrc: '/assets/icons/subcategorias/carniceria%20Background%20Removed.png', label: 'Carnicería' },
  'polleria':                 { iconSrc: '/assets/icons/subcategorias/polleria%20Background%20Removed.png', label: 'Pollería' },
  'panaderia':                { iconSrc: '/assets/icons/subcategorias/panaderia%20Background%20Removed.png', label: 'Panadería' },
  'pescaderia':               { iconSrc: '/assets/icons/subcategorias/pescaderia%20Background%20Removed.png', label: 'Pescadería' },
  'dietetica':                { iconSrc: '/assets/icons/subcategorias/dietetica%20Background%20Removed.png', label: 'Dietética' },
  'kiosco':                   { iconSrc: '/assets/icons/categorias/promo%20Background%20Removed.png',        label: 'Kiosco' },

  // Indumentaria
  'ropa':                     { iconSrc: '/assets/icons/subcategorias/comprasropa%20Background%20Removed.png', label: 'Ropa' },
  'calzado':                  { iconSrc: '/assets/icons/subcategorias/zapatillas%20Background%20Removed.png', label: 'Calzado' },
  'accesorios':               { iconSrc: '/assets/icons/subcategorias/accesorios%20Background%20Removed.png', label: 'Accesorios' },

  // Servicios
  'alquiler':                 { iconSrc: '/assets/icons/subcategorias/alquiler%20Background%20Removed.png', label: 'Alquiler' },
  'expensas':                 { iconSrc: '/assets/icons/subcategorias/expensas%20Background%20Removed.png', label: 'Expensas' },
  'luz':                      { iconSrc: '/assets/icons/subcategorias/energialuz%20Background%20Removed.png', label: 'Luz' },
  'electricidad':             { iconSrc: '/assets/icons/subcategorias/energialuz%20Background%20Removed.png', label: 'Luz' },
  'gas':                      { iconSrc: '/assets/icons/subcategorias/gas%20Background%20Removed.png', label: 'Gas' },
  'agua':                     { iconSrc: '/assets/icons/subcategorias/agua%20Background%20Removed.png', label: 'Agua' },
  'seguros':                  { iconSrc: '/assets/icons/subcategorias/seguro%20Background%20Removed.png', label: 'Seguros' },
  'seguro':                   { iconSrc: '/assets/icons/subcategorias/seguro%20Background%20Removed.png', label: 'Seguros' },
  'impuestos':                { iconSrc: '/assets/icons/subcategorias/impuestos%20Background%20Removed.png', label: 'Impuestos' },

  // Hogar
  'muebles y electrodomesticos': { iconSrc: '/assets/icons/subcategorias/decoracion%20Background%20Removed.png', label: 'Muebles y electrodomésticos' },
  'muebles y decoracion':     { iconSrc: '/assets/icons/subcategorias/decoracion%20Background%20Removed.png', label: 'Muebles y decoración' },
  'reparaciones':             { iconSrc: '/assets/icons/subcategorias/mentenimiento%20Background%20Removed.png', label: 'Reparaciones' },
  'mantenimiento':            { iconSrc: '/assets/icons/subcategorias/mentenimiento%20Background%20Removed.png', label: 'Reparaciones' },
  'limpieza':                 { iconSrc: '/assets/icons/subcategorias/limpieza%20Background%20Removed.png', label: 'Limpieza' },

  // Salud
  'medico / consulta':        { iconSrc: '/assets/icons/subcategorias/medicoconsulta%20Background%20Removed.png', label: 'Médico / Consulta' },
  'medico':                   { iconSrc: '/assets/icons/subcategorias/medicoconsulta%20Background%20Removed.png', label: 'Médico' },
  'odontologia':              { iconSrc: '/assets/icons/subcategorias/dentista%20Background%20Removed.png', label: 'Odontología' },
  'dentista':                 { iconSrc: '/assets/icons/subcategorias/dentista%20Background%20Removed.png', label: 'Odontología' },
  'optica':                   { iconSrc: '/assets/icons/subcategorias/optica%20Background%20Removed.png', label: 'Óptica' },
  'estudios y analisis':      { iconSrc: '/assets/icons/subcategorias/estudiosmedicos%20Background%20Removed.png', label: 'Estudios y análisis' },
  'estudios medicos':         { iconSrc: '/assets/icons/subcategorias/estudiosmedicos%20Background%20Removed.png', label: 'Estudios y análisis' },
  'farmacia':                 { iconSrc: '/assets/icons/subcategorias/farmacia%20Background%20Removed.png', label: 'Farmacia' },
  'obra social / prepaga':    { iconSrc: '/assets/icons/subcategorias/mutualprepaga%20Background%20Removed.png', label: 'Obra social / Prepaga' },
  'obra social':              { iconSrc: '/assets/icons/subcategorias/mutualprepaga%20Background%20Removed.png', label: 'Obra social' },
  'terapias':                 { iconSrc: '/assets/icons/subcategorias/psicologia%20Background%20Removed.png', label: 'Terapias' },
  'terapia':                  { iconSrc: '/assets/icons/subcategorias/psicologia%20Background%20Removed.png', label: 'Terapias' },
  'kinesiologia':             { iconSrc: '/assets/icons/subcategorias/kinesiologia%20Background%20Removed.png', label: 'Terapias' },
  'peluqueria':               { iconSrc: '/assets/icons/subcategorias/peluqueria%20Background%20Removed.png', label: 'Peluquería' },

  // Transporte
  'combustible':              { iconSrc: '/assets/icons/subcategorias/combustible%20Background%20Removed.png', label: 'Combustible' },
  'transporte publico':       { iconSrc: '/assets/icons/categorias/transporte%20Background%20Removed.png', label: 'Transporte público' },
  'taxi / apps':              { iconSrc: '/assets/icons/subcategorias/taxi%20Background%20Removed.png', label: 'Taxi / Apps' },
  'taxi / remis':             { iconSrc: '/assets/icons/subcategorias/taxi%20Background%20Removed.png', label: 'Taxi / Apps' },
  'mantenimiento y seguro del auto': { iconSrc: '/assets/icons/subcategorias/mecanico%20Background%20Removed.png', label: 'Mantenimiento y seguro del auto' },
  'mantenimiento del auto':   { iconSrc: '/assets/icons/subcategorias/mecanico%20Background%20Removed.png', label: 'Mantenimiento del auto' },
  'seguro del auto':          { iconSrc: '/assets/icons/subcategorias/seguro%20Background%20Removed.png', label: 'Seguro del auto' },
  'bicicleta / patineta':     { iconSrc: '/assets/icons/subcategorias/bicicleta%20Background%20Removed.png', label: 'Bicicleta / Patineta' },
  'bicicleta':                { iconSrc: '/assets/icons/subcategorias/bicicleta%20Background%20Removed.png', label: 'Bicicleta' },
  'peajes':                   { iconSrc: '/assets/icons/subcategorias/peaje%20Background%20Removed.png', label: 'Peajes' },
  'peaje':                    { iconSrc: '/assets/icons/subcategorias/peaje%20Background%20Removed.png', label: 'Peajes' },
  'estacionamiento':          { iconSrc: '/assets/icons/subcategorias/estacionamiento%20Background%20Removed.png', label: 'Estacionamiento' },

  // Comunicación
  'celular':                  { iconSrc: '/assets/icons/subcategorias/telefono%20Background%20Removed.png', label: 'Celular' },
  'telefono':                 { iconSrc: '/assets/icons/subcategorias/telefono%20Background%20Removed.png', label: 'Celular' },
  'telefono fijo':            { iconSrc: '/assets/icons/subcategorias/telefono%20Background%20Removed.png', label: 'Teléfono fijo' },
  'internet y cable':         { iconSrc: '/assets/icons/subcategorias/internet%20Background%20Removed.png', label: 'Internet y cable' },
  'internet':                 { iconSrc: '/assets/icons/subcategorias/internet%20Background%20Removed.png', label: 'Internet y cable' },
  'cable / tv':               { iconSrc: '/assets/icons/subcategorias/tv%20Background%20Removed.png', label: 'Cable / TV' },

  // Recreativo
  'suscripciones':            { iconSrc: '/assets/icons/categorias/serviciosdigitales%20Background%20Removed.png', label: 'Suscripciones' },
  'streaming':                { iconSrc: '/assets/icons/categorias/peliculas%20Background%20Removed.png', label: 'Suscripciones' },
  'salidas':                  { iconSrc: '/assets/icons/subcategorias/fiesta%20Background%20Removed.png', label: 'Salidas' },
  'salidas y entretenimiento':{ iconSrc: '/assets/icons/subcategorias/fiesta%20Background%20Removed.png', label: 'Salidas' },
  'salidas con amigos':       { iconSrc: '/assets/icons/subcategorias/fiesta%20Background%20Removed.png', label: 'Salidas' },
  'cine / teatro / recitales':{ iconSrc: '/assets/icons/subcategorias/peliculasycine%20Background%20Removed.png', label: 'Salidas' },
  'cine/teatro':              { iconSrc: '/assets/icons/subcategorias/peliculasycine%20Background%20Removed.png', label: 'Salidas' },
  'deportes y gimnasio':      { iconSrc: '/assets/icons/subcategorias/gym%20Background%20Removed.png', label: 'Deportes y gimnasio' },
  'gimnasio':                 { iconSrc: '/assets/icons/subcategorias/gym%20Background%20Removed.png', label: 'Deportes y gimnasio' },
  'deportes':                 { iconSrc: '/assets/icons/subcategorias/deportes%20Background%20Removed.png', label: 'Deportes y gimnasio' },
  'hobbies y juegos':         { iconSrc: '/assets/icons/subcategorias/hobbies%20Background%20Removed.png', label: 'Hobbies y juegos' },
  'hobbies':                  { iconSrc: '/assets/icons/subcategorias/hobbies%20Background%20Removed.png', label: 'Hobbies y juegos' },
  'juegos y videojuegos':     { iconSrc: '/assets/icons/subcategorias/juegos%20Background%20Removed.png', label: 'Hobbies y juegos' },
  'juegos':                   { iconSrc: '/assets/icons/subcategorias/juegos%20Background%20Removed.png', label: 'Juegos' },
  'viajes':                   { iconSrc: '/assets/icons/subcategorias/vacaciones%20Background%20Removed.png', label: 'Viajes' },
  'vacaciones y viajes':      { iconSrc: '/assets/icons/subcategorias/vacaciones%20Background%20Removed.png', label: 'Viajes' },

  // Educación
  'cuotas':                   { iconSrc: '/assets/icons/subcategorias/escuela%20Background%20Removed.png', label: 'Cuotas' },
  'cuotas escolares / universitarias': { iconSrc: '/assets/icons/subcategorias/escuela%20Background%20Removed.png', label: 'Cuotas' },
  'cursos y capacitaciones':  { iconSrc: '/assets/icons/subcategorias/cursos%20Background%20Removed.png', label: 'Cursos' },
  'cursos':                   { iconSrc: '/assets/icons/subcategorias/cursos%20Background%20Removed.png', label: 'Cursos' },
  'materiales y libros':      { iconSrc: '/assets/icons/subcategorias/libro%20Background%20Removed.png', label: 'Materiales y libros' },
  'libros y materiales':      { iconSrc: '/assets/icons/subcategorias/libro%20Background%20Removed.png', label: 'Materiales y libros' },
  'libros':                   { iconSrc: '/assets/icons/subcategorias/libro%20Background%20Removed.png', label: 'Libros' },
  'idiomas':                  { iconSrc: '/assets/icons/subcategorias/idioma%20Background%20Removed.png', label: 'Idiomas' },
  'guarderia / jardin':       { iconSrc: '/assets/icons/subcategorias/guarderia%20Background%20Removed.png', label: 'Guardería' },

  // Restaurantes y delivery
  'restaurantes':             { iconSrc: '/assets/icons/subcategorias/restaurante%20Background%20Removed.png', label: 'Restaurantes' },
  'restaurante':              { iconSrc: '/assets/icons/subcategorias/restaurante%20Background%20Removed.png', label: 'Restaurantes' },
  'delivery':                 { iconSrc: '/assets/icons/subcategorias/delivery%20Background%20Removed.png', label: 'Delivery' },
  'cafeteria':                { iconSrc: '/assets/icons/subcategorias/cafeteria%20Background%20Removed.png', label: 'Cafetería' },
  'bar':                      { iconSrc: '/assets/icons/subcategorias/bar%20Background%20Removed.png', label: 'Restaurantes' },
  'heladeria':                { iconSrc: '/assets/icons/subcategorias/heladeria%20Background%20Removed.png', label: 'Cafetería' },

  // Otros (egreso / ingreso)
  'cuidado personal':         { iconSrc: '/assets/icons/subcategorias/spa%20Background%20Removed.png', label: 'Cuidado personal' },
  'mascotas':                 { iconSrc: '/assets/icons/subcategorias/mascotas%20Background%20Removed.png', label: 'Mascotas' },
  'regalos':                  { iconSrc: '/assets/icons/categorias/regalo%20Background%20Removed.png', label: 'Regalos' },
  'regalos y donaciones':     { iconSrc: '/assets/icons/categorias/regalo%20Background%20Removed.png', label: 'Regalos' },
  'reintegros':               { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Reintegros' },
  'otros':                    { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png', label: 'Otros' },
  'general':                  { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png', label: 'General' },

  // Banco
  'ahorros':                  { iconSrc: '/assets/icons/subcategorias/ahorro%20Background%20Removed.png', label: 'Ahorros' },
  'ahorro':                   { iconSrc: '/assets/icons/subcategorias/ahorro%20Background%20Removed.png', label: 'Ahorros' },
  'comisiones y gastos bancarios': { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png', label: 'Comisiones y gastos bancarios' },
  'gastos bancarios y comisiones': { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png', label: 'Gastos bancarios y comisiones' },
  'prestamos':                { iconSrc: '/assets/icons/subcategorias/prestamos%20Background%20Removed.png', label: 'Préstamos' },
  'intereses pagados':        { iconSrc: '/assets/icons/subcategorias/tarjeta%20Background%20Removed.png', label: 'Intereses pagados' },
  'impuesto al cheque / movimientos': { iconSrc: '/assets/icons/subcategorias/impuestos%20Background%20Removed.png', label: 'Impuesto al cheque' },

  // Empleo
  'sueldo':                   { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png', label: 'Sueldo' },
  'aguinaldo':                { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png', label: 'Aguinaldo' },
  'bonos y horas extras':     { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Bonos y horas extras' },
  'horas extra':              { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Horas extra' },
  'bonos':                    { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Bonos' },

  // Trabajo independiente
  'honorarios':               { iconSrc: '/assets/icons/categorias/trato%20Background%20Removed.png', label: 'Honorarios' },
  'venta de productos/servicios': { iconSrc: '/assets/icons/categorias/promo%20Background%20Removed.png', label: 'Venta de productos/servicios' },
  'freelance':                { iconSrc: '/assets/icons/categorias/trato%20Background%20Removed.png', label: 'Freelance' },

  // Inversiones y rentas
  'dividendos e intereses':   { iconSrc: '/assets/icons/subcategorias/inversiones%20Background%20Removed.png', label: 'Dividendos e intereses' },
  'alquileres cobrados':      { iconSrc: '/assets/icons/subcategorias/alquiler%20Background%20Removed.png', label: 'Alquileres cobrados' },

  'default':                  { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png', label: 'General' }
}

export function getSubcategoriaVisual(nombre?: string | null): SubcategoriaVisual | null {
  if (!nombre) return null
  const key = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  if (key === 'general' || key === 'otros' || key === 'sin subcategoria' || key === 'sin subcategoria') return null
  return SUBCATEGORIA_VISUAL[key] ?? null
}

