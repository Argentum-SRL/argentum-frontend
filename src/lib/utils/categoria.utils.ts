export interface CategoriaVisual {
  iconSrc: string
  label: string
}

export interface SubcategoriaVisual {
  iconSrc: string
  label: string
}

export const CATEGORIA_VISUAL: Record<string, CategoriaVisual> = {
  // Categorías de Gasto (Egreso)
  'alimentacion':             { iconSrc: '/assets/icons/categorias/alimentacion%20Background%20Removed.png', label: 'Alimentación' },
  'gastronomia':              { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Gastronomía' },
  'restaurante':              { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Gastronomía' },
  'restaurantes':             { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Gastronomía' },
  'restaurantes y delivery':  { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Gastronomía' },
  'transporte':               { iconSrc: '/assets/icons/categorias/transporte%20Background%20Removed.png',   label: 'Transporte' },
  'vivienda':                 { iconSrc: '/assets/icons/categorias/luz%20Background%20Removed.png',          label: 'Vivienda' },
  'casa':                     { iconSrc: '/assets/icons/categorias/casa%20Background%20Removed.png',         label: 'Vivienda' },
  'servicios':                { iconSrc: '/assets/icons/categorias/luz%20Background%20Removed.png',          label: 'Servicios' },
  'hogar':                    { iconSrc: '/assets/icons/categorias/equipamientodelhogar%20Background%20Removed.png', label: 'Hogar' },
  'equipamiento del hogar':   { iconSrc: '/assets/icons/categorias/equipamientodelhogar%20Background%20Removed.png', label: 'Equipamiento del hogar' },
  'salud':                    { iconSrc: '/assets/icons/categorias/medicina%20Background%20Removed.png',     label: 'Salud' },
  'salud y cuidado personal': { iconSrc: '/assets/icons/categorias/medicina%20Background%20Removed.png',     label: 'Salud' },
  'cuidado personal':         { iconSrc: '/assets/icons/subcategorias/spa%20Background%20Removed.png',       label: 'Cuidado personal' },
  'ocio':                     { iconSrc: '/assets/icons/categorias/entretenimiento%20Background%20Removed.png', label: 'Ocio' },
  'entretenimiento':          { iconSrc: '/assets/icons/categorias/entretenimiento%20Background%20Removed.png', label: 'Entretenimiento' },
  'entretenimiento y salidas':{ iconSrc: '/assets/icons/categorias/entretenimiento%20Background%20Removed.png', label: 'Entretenimiento' },
  'recreativo':               { iconSrc: '/assets/icons/categorias/entretenimiento%20Background%20Removed.png', label: 'Recreativo' },
  'educacion':                { iconSrc: '/assets/icons/categorias/libros%20Background%20Removed.png',       label: 'Educación' },
  'indumentaria':             { iconSrc: '/assets/icons/categorias/remera%20Background%20Removed.png',       label: 'Indumentaria' },
  'ropa':                     { iconSrc: '/assets/icons/categorias/remera%20Background%20Removed.png',       label: 'Indumentaria' },
  'ropa e indumentaria':      { iconSrc: '/assets/icons/categorias/remera%20Background%20Removed.png',       label: 'Indumentaria' },
  'tecnologia':               { iconSrc: '/assets/icons/subcategorias/equipos%20Background%20Removed.png',    label: 'Tecnología' },
  'comunicacion':             { iconSrc: '/assets/icons/subcategorias/internet%20Background%20Removed.png',  label: 'Comunicación' },
  'impuestos':                { iconSrc: '/assets/icons/categorias/impuestos%20Background%20Removed.png',    label: 'Impuestos' },
  'banco':                    { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png',        label: 'Banco' },
  'otros':                    { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png',  label: 'Otros' },
  'otros gastos':             { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png',  label: 'Otros' },
  'ahorro':                   { iconSrc: '/assets/icons/categorias/ahorro%20Background%20Removed.png',       label: 'Ahorro' },

  'servicios digitales':      { iconSrc: '/assets/icons/categorias/serviciosdigitales%20Background%20Removed.png', label: 'Servicios digitales' },
  'gastos bancarios y comisiones': { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png', label: 'Gastos bancarios' },
  'gastos bancarios':         { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png',        label: 'Gastos bancarios' },
  'comida afuera':            { iconSrc: '/assets/icons/categorias/hamburguesa%20Background%20Removed.png',  label: 'Comida afuera' },
  'ingresos':                 { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Ingresos' },

  // Categorías de Ingreso
  'trabajo':                  { iconSrc: '/assets/icons/categorias/maletin%20Background%20Removed.png',      label: 'Trabajo' },
  'empleo':                   { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png',      label: 'Empleo' },
  'sueldo':                   { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png',      label: 'Empleo' },
  'trabajo en relacion de dependencia': { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png', label: 'Empleo' },
  'trabajo independiente':    { iconSrc: '/assets/icons/categorias/trato%20Background%20Removed.png',        label: 'Trabajo independiente' },
  'jubilacion y auh':         { iconSrc: '/assets/icons/subcategorias/jubilacion%20Background%20Removed.png', label: 'Jubilación y AUH' },
  'inversiones':              { iconSrc: '/assets/icons/subcategorias/inversiones%20Background%20Removed.png', label: 'Inversiones' },
  'inversiones y rentas':     { iconSrc: '/assets/icons/subcategorias/inversiones%20Background%20Removed.png', label: 'Inversiones y rentas' },
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

  // Gastronomía
  'restaurantes':             { iconSrc: '/assets/icons/subcategorias/restaurante%20Background%20Removed.png', label: 'Restaurantes' },
  'restaurante':              { iconSrc: '/assets/icons/subcategorias/restaurante%20Background%20Removed.png', label: 'Restaurantes' },
  'delivery':                 { iconSrc: '/assets/icons/subcategorias/delivery%20Background%20Removed.png', label: 'Delivery' },
  'cafeteria':                { iconSrc: '/assets/icons/subcategorias/cafeteria%20Background%20Removed.png', label: 'Cafetería' },
  'bar':                      { iconSrc: '/assets/icons/subcategorias/bar%20Background%20Removed.png', label: 'Restaurantes' },
  'heladeria':                { iconSrc: '/assets/icons/subcategorias/heladeria%20Background%20Removed.png', label: 'Cafetería' },

  // Transporte
  'transporte publico':       { iconSrc: '/assets/icons/categorias/transporte%20Background%20Removed.png', label: 'Transporte público' },
  'taxi y apps':              { iconSrc: '/assets/icons/subcategorias/taxi%20Background%20Removed.png', label: 'Taxi y apps' },
  'taxi / apps':              { iconSrc: '/assets/icons/subcategorias/taxi%20Background%20Removed.png', label: 'Taxi y apps' },
  'taxi / remis':             { iconSrc: '/assets/icons/subcategorias/taxi%20Background%20Removed.png', label: 'Taxi y apps' },
  'combustible':              { iconSrc: '/assets/icons/subcategorias/combustible%20Background%20Removed.png', label: 'Combustible' },
  'estacionamiento':          { iconSrc: '/assets/icons/subcategorias/estacionamiento%20Background%20Removed.png', label: 'Estacionamiento' },
  'peajes':                   { iconSrc: '/assets/icons/subcategorias/peaje%20Background%20Removed.png', label: 'Peajes' },
  'peaje':                    { iconSrc: '/assets/icons/subcategorias/peaje%20Background%20Removed.png', label: 'Peajes' },
  'auto':                     { iconSrc: '/assets/icons/subcategorias/mecanico%20Background%20Removed.png', label: 'Auto' },
  'mantenimiento y seguro del auto': { iconSrc: '/assets/icons/subcategorias/mecanico%20Background%20Removed.png', label: 'Auto' },
  'mantenimiento del auto':   { iconSrc: '/assets/icons/subcategorias/mecanico%20Background%20Removed.png', label: 'Auto' },
  'seguro del auto':          { iconSrc: '/assets/icons/subcategorias/seguro%20Background%20Removed.png', label: 'Seguro del auto' },
  'bicicleta / patineta':     { iconSrc: '/assets/icons/subcategorias/bicicleta%20Background%20Removed.png', label: 'Bicicleta / Patineta' },
  'bicicleta':                { iconSrc: '/assets/icons/subcategorias/bicicleta%20Background%20Removed.png', label: 'Bicicleta' },

  // Vivienda
  'alquiler':                 { iconSrc: '/assets/icons/subcategorias/alquiler%20Background%20Removed.png', label: 'Alquiler' },
  'expensas':                 { iconSrc: '/assets/icons/subcategorias/expensas%20Background%20Removed.png', label: 'Expensas' },
  'luz':                      { iconSrc: '/assets/icons/subcategorias/energialuz%20Background%20Removed.png', label: 'Luz' },
  'electricidad':             { iconSrc: '/assets/icons/subcategorias/energialuz%20Background%20Removed.png', label: 'Luz' },
  'gas':                      { iconSrc: '/assets/icons/subcategorias/gas%20Background%20Removed.png', label: 'Gas' },
  'agua':                     { iconSrc: '/assets/icons/subcategorias/agua%20Background%20Removed.png', label: 'Agua' },

  // Hogar
  'limpieza':                 { iconSrc: '/assets/icons/subcategorias/limpieza%20Background%20Removed.png', label: 'Limpieza' },
  'muebles y electro':        { iconSrc: '/assets/icons/subcategorias/decoracion%20Background%20Removed.png', label: 'Muebles y electro' },
  'muebles y electrodomesticos': { iconSrc: '/assets/icons/subcategorias/decoracion%20Background%20Removed.png', label: 'Muebles y electro' },
  'muebles y decoracion':     { iconSrc: '/assets/icons/subcategorias/decoracion%20Background%20Removed.png', label: 'Muebles y decoración' },
  'reparaciones':             { iconSrc: '/assets/icons/subcategorias/mentenimiento%20Background%20Removed.png', label: 'Reparaciones' },
  'mantenimiento':            { iconSrc: '/assets/icons/subcategorias/mentenimiento%20Background%20Removed.png', label: 'Reparaciones' },
  'servicio domestico':       { iconSrc: '/assets/icons/subcategorias/serviciodomestico%20Background%20Removed.png', label: 'Servicio doméstico' },

  // Salud
  'prepaga y obra social':    { iconSrc: '/assets/icons/subcategorias/mutualprepaga%20Background%20Removed.png', label: 'Prepaga y obra social' },
  'obra social / prepaga':    { iconSrc: '/assets/icons/subcategorias/mutualprepaga%20Background%20Removed.png', label: 'Prepaga y obra social' },
  'obra social':              { iconSrc: '/assets/icons/subcategorias/mutualprepaga%20Background%20Removed.png', label: 'Obra social' },
  'medico':                   { iconSrc: '/assets/icons/subcategorias/medicoconsulta%20Background%20Removed.png', label: 'Médico' },
  'medico / consulta':        { iconSrc: '/assets/icons/subcategorias/medicoconsulta%20Background%20Removed.png', label: 'Médico' },
  'farmacia':                 { iconSrc: '/assets/icons/subcategorias/farmacia%20Background%20Removed.png', label: 'Farmacia' },
  'dentista':                 { iconSrc: '/assets/icons/subcategorias/dentista%20Background%20Removed.png', label: 'Dentista' },
  'odontologia':              { iconSrc: '/assets/icons/subcategorias/dentista%20Background%20Removed.png', label: 'Dentista' },
  'terapias':                 { iconSrc: '/assets/icons/subcategorias/psicologia%20Background%20Removed.png', label: 'Terapias' },
  'terapia':                  { iconSrc: '/assets/icons/subcategorias/psicologia%20Background%20Removed.png', label: 'Terapias' },
  'kinesiologia':             { iconSrc: '/assets/icons/subcategorias/kinesiologia%20Background%20Removed.png', label: 'Terapias' },
  'estudios y analisis':      { iconSrc: '/assets/icons/subcategorias/estudiosmedicos%20Background%20Removed.png', label: 'Estudios y análisis' },
  'estudios medicos':         { iconSrc: '/assets/icons/subcategorias/estudiosmedicos%20Background%20Removed.png', label: 'Estudios y análisis' },
  'optica':                   { iconSrc: '/assets/icons/subcategorias/optica%20Background%20Removed.png', label: 'Óptica' },

  // Cuidado personal
  'peluqueria y belleza':     { iconSrc: '/assets/icons/subcategorias/peluqueria%20Background%20Removed.png', label: 'Peluquería y belleza' },
  'peluqueria':               { iconSrc: '/assets/icons/subcategorias/peluqueria%20Background%20Removed.png', label: 'Peluquería y belleza' },
  'perfumeria':               { iconSrc: '/assets/icons/subcategorias/perfumeria%20Background%20Removed.png', label: 'Perfumería' },
  'cuidado personal':         { iconSrc: '/assets/icons/subcategorias/spa%20Background%20Removed.png', label: 'Cuidado personal' },

  // Ocio
  'salidas':                  { iconSrc: '/assets/icons/subcategorias/fiesta%20Background%20Removed.png', label: 'Salidas' },
  'salidas y entretenimiento':{ iconSrc: '/assets/icons/subcategorias/fiesta%20Background%20Removed.png', label: 'Salidas' },
  'salidas con amigos':       { iconSrc: '/assets/icons/subcategorias/fiesta%20Background%20Removed.png', label: 'Salidas' },
  'cine / teatro / recitales':{ iconSrc: '/assets/icons/subcategorias/peliculasycine%20Background%20Removed.png', label: 'Salidas' },
  'cine/teatro':              { iconSrc: '/assets/icons/subcategorias/peliculasycine%20Background%20Removed.png', label: 'Salidas' },
  'streaming':                { iconSrc: '/assets/icons/categorias/serviciosdigitales%20Background%20Removed.png', label: 'Streaming' },
  'suscripciones':            { iconSrc: '/assets/icons/categorias/serviciosdigitales%20Background%20Removed.png', label: 'Streaming' },
  'hobbies y juegos':         { iconSrc: '/assets/icons/subcategorias/hobbies%20Background%20Removed.png', label: 'Hobbies y juegos' },
  'hobbies':                  { iconSrc: '/assets/icons/subcategorias/hobbies%20Background%20Removed.png', label: 'Hobbies y juegos' },
  'juegos y videojuegos':     { iconSrc: '/assets/icons/subcategorias/juegos%20Background%20Removed.png', label: 'Hobbies y juegos' },
  'juegos':                   { iconSrc: '/assets/icons/subcategorias/juegos%20Background%20Removed.png', label: 'Hobbies y juegos' },
  'deportes y gimnasio':      { iconSrc: '/assets/icons/subcategorias/gym%20Background%20Removed.png', label: 'Deportes y gimnasio' },
  'gimnasio':                 { iconSrc: '/assets/icons/subcategorias/gym%20Background%20Removed.png', label: 'Deportes y gimnasio' },
  'deportes':                 { iconSrc: '/assets/icons/subcategorias/deportes%20Background%20Removed.png', label: 'Deportes y gimnasio' },
  'viajes':                   { iconSrc: '/assets/icons/subcategorias/vacaciones%20Background%20Removed.png', label: 'Viajes' },
  'vacaciones y viajes':      { iconSrc: '/assets/icons/subcategorias/vacaciones%20Background%20Removed.png', label: 'Viajes' },

  // Educación
  'colegio y facultad':       { iconSrc: '/assets/icons/subcategorias/escuela%20Background%20Removed.png', label: 'Colegio y facultad' },
  'cuotas':                   { iconSrc: '/assets/icons/subcategorias/escuela%20Background%20Removed.png', label: 'Colegio y facultad' },
  'cuotas escolares / universitarias': { iconSrc: '/assets/icons/subcategorias/escuela%20Background%20Removed.png', label: 'Colegio y facultad' },
  'cursos':                   { iconSrc: '/assets/icons/subcategorias/cursos%20Background%20Removed.png', label: 'Cursos' },
  'cursos y capacitaciones':  { iconSrc: '/assets/icons/subcategorias/cursos%20Background%20Removed.png', label: 'Cursos' },
  'idiomas':                  { iconSrc: '/assets/icons/subcategorias/idioma%20Background%20Removed.png', label: 'Cursos' },
  'libros y utiles':          { iconSrc: '/assets/icons/subcategorias/libro%20Background%20Removed.png', label: 'Libros y útiles' },
  'materiales y libros':      { iconSrc: '/assets/icons/subcategorias/libro%20Background%20Removed.png', label: 'Libros y útiles' },
  'libros y materiales':      { iconSrc: '/assets/icons/subcategorias/libro%20Background%20Removed.png', label: 'Libros y útiles' },
  'libros':                   { iconSrc: '/assets/icons/subcategorias/libro%20Background%20Removed.png', label: 'Libros' },
  'guarderia / jardin':       { iconSrc: '/assets/icons/subcategorias/guarderia%20Background%20Removed.png', label: 'Guardería' },

  // Indumentaria
  'ropa':                     { iconSrc: '/assets/icons/subcategorias/comprasropa%20Background%20Removed.png', label: 'Ropa' },
  'calzado':                  { iconSrc: '/assets/icons/subcategorias/zapatillas%20Background%20Removed.png', label: 'Calzado' },
  'accesorios':               { iconSrc: '/assets/icons/subcategorias/accesorios%20Background%20Removed.png', label: 'Accesorios' },

  // Tecnología
  'celular':                  { iconSrc: '/assets/icons/subcategorias/telefono%20Background%20Removed.png', label: 'Celular' },
  'telefono':                 { iconSrc: '/assets/icons/subcategorias/telefono%20Background%20Removed.png', label: 'Celular' },
  'telefono fijo':            { iconSrc: '/assets/icons/subcategorias/telefono%20Background%20Removed.png', label: 'Teléfono fijo' },
  'internet':                 { iconSrc: '/assets/icons/subcategorias/internet%20Background%20Removed.png', label: 'Internet' },
  'internet y cable':         { iconSrc: '/assets/icons/subcategorias/internet%20Background%20Removed.png', label: 'Internet' },
  'cable / tv':               { iconSrc: '/assets/icons/subcategorias/tv%20Background%20Removed.png', label: 'Cable / TV' },
  'apps y programas':         { iconSrc: '/assets/icons/subcategorias/apps%20Background%20Removed.png', label: 'Apps y programas' },
  'equipos':                  { iconSrc: '/assets/icons/subcategorias/equipos%20Background%20Removed.png', label: 'Equipos' },

  // Impuestos
  'abl e inmobiliario':       { iconSrc: '/assets/icons/subcategorias/abl%20Background%20Removed.png', label: 'ABL e inmobiliario' },
  'patente':                  { iconSrc: '/assets/icons/subcategorias/patente%20Background%20Removed.png', label: 'Patente' },
  'monotributo':              { iconSrc: '/assets/icons/subcategorias/monotributo%20Background%20Removed.png', label: 'Monotributo' },
  'impuestos':                { iconSrc: '/assets/icons/subcategorias/impuestos%20Background%20Removed.png', label: 'Impuestos' },

  // Banco
  'comisiones':               { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png', label: 'Comisiones' },
  'comisiones y gastos bancarios': { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png', label: 'Comisiones' },
  'gastos bancarios y comisiones': { iconSrc: '/assets/icons/categorias/banco%20Background%20Removed.png', label: 'Comisiones' },
  'prestamos':                { iconSrc: '/assets/icons/subcategorias/prestamos%20Background%20Removed.png', label: 'Préstamos' },
  'seguros':                  { iconSrc: '/assets/icons/subcategorias/seguro%20Background%20Removed.png', label: 'Seguros' },
  'seguro':                   { iconSrc: '/assets/icons/subcategorias/seguro%20Background%20Removed.png', label: 'Seguros' },
  'tarjeta de credito':       { iconSrc: '/assets/icons/subcategorias/tarjeta%20Background%20Removed.png', label: 'Tarjeta de crédito' },
  'impuesto al cheque / movimientos': { iconSrc: '/assets/icons/subcategorias/impuestos%20Background%20Removed.png', label: 'Impuesto al cheque' },

  // Intereses (ambos tipos y específicos)
  'banco|intereses':          { iconSrc: '/assets/icons/subcategorias/tarjeta%20Background%20Removed.png', label: 'Intereses' },
  'inversiones|intereses':    { iconSrc: '/assets/icons/subcategorias/inversiones%20Background%20Removed.png', label: 'Intereses' },
  'intereses':                { iconSrc: '/assets/icons/subcategorias/tarjeta%20Background%20Removed.png', label: 'Intereses' },
  'intereses pagados':        { iconSrc: '/assets/icons/subcategorias/tarjeta%20Background%20Removed.png', label: 'Intereses' },
  'dividendos e intereses':   { iconSrc: '/assets/icons/subcategorias/inversiones%20Background%20Removed.png', label: 'Intereses' },

  // Otros (egreso)
  'regalos':                  { iconSrc: '/assets/icons/categorias/regalo%20Background%20Removed.png', label: 'Regalos' },
  'regalos y donaciones':     { iconSrc: '/assets/icons/categorias/regalo%20Background%20Removed.png', label: 'Regalos' },
  'mascotas':                 { iconSrc: '/assets/icons/subcategorias/mascotas%20Background%20Removed.png', label: 'Mascotas' },
  'ayuda familiar':           { iconSrc: '/assets/icons/subcategorias/ayudafamiliar%20Background%20Removed.png', label: 'Ayuda familiar' },
  'pagos a personas':         { iconSrc: '/assets/icons/subcategorias/personas%20Background%20Removed.png', label: 'Pagos a personas' },

  // Trabajo (ingreso)
  'sueldo':                   { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png', label: 'Sueldo' },
  'aguinaldo':                { iconSrc: '/assets/icons/categorias/salario%20Background%20Removed.png', label: 'Aguinaldo' },
  'bonos y extras':           { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Bonos y extras' },
  'bonos y horas extras':     { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Bonos y extras' },
  'horas extra':              { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Horas extra' },
  'bonos':                    { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Bonos' },
  'freelance y changas':      { iconSrc: '/assets/icons/categorias/trato%20Background%20Removed.png', label: 'Freelance y changas' },
  'honorarios':               { iconSrc: '/assets/icons/categorias/trato%20Background%20Removed.png', label: 'Honorarios' },
  'freelance':                { iconSrc: '/assets/icons/categorias/trato%20Background%20Removed.png', label: 'Freelance' },
  'ventas':                   { iconSrc: '/assets/icons/categorias/negocio%20Background%20Removed.png', label: 'Ventas' },
  'venta de productos/servicios': { iconSrc: '/assets/icons/categorias/negocio%20Background%20Removed.png', label: 'Ventas' },

  // Jubilación y AUH
  'jubilacion o pension':     { iconSrc: '/assets/icons/subcategorias/jubilacion%20Background%20Removed.png', label: 'Jubilación o pensión' },
  'auh y asignaciones':       { iconSrc: '/assets/icons/subcategorias/asignaciones%20Background%20Removed.png', label: 'AUH y asignaciones' },

  // Inversiones (ingreso)
  'alquileres':               { iconSrc: '/assets/icons/subcategorias/alquiler%20Background%20Removed.png', label: 'Alquileres' },
  'alquileres cobrados':      { iconSrc: '/assets/icons/subcategorias/alquiler%20Background%20Removed.png', label: 'Alquileres' },

  // Otros (ingreso)
  'cobros de personas':       { iconSrc: '/assets/icons/subcategorias/personas%20Background%20Removed.png', label: 'Cobros de personas' },
  'reintegros':               { iconSrc: '/assets/icons/categorias/dineroenmano%20Background%20Removed.png', label: 'Reintegros' },

  'otros':                    { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png', label: 'Otros' },
  'general':                  { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png', label: 'General' },
  'ahorros':                  { iconSrc: '/assets/icons/subcategorias/ahorro%20Background%20Removed.png', label: 'Ahorros' },
  'ahorro':                   { iconSrc: '/assets/icons/subcategorias/ahorro%20Background%20Removed.png', label: 'Ahorros' },
  'default':                  { iconSrc: '/assets/icons/categorias/herramienta%20Background%20Removed.png', label: 'General' },
}

export function getSubcategoriaVisual(nombre?: string | null, categoriaPadre?: string | null): SubcategoriaVisual | null {
  if (!nombre) return null
  const subKey = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  if (subKey === 'general' || subKey === 'otros' || subKey === 'sin subcategoria') return null

  if (categoriaPadre) {
    const padreKey = categoriaPadre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    const compoundKey = `${padreKey}|${subKey}`
    if (SUBCATEGORIA_VISUAL[compoundKey]) {
      return SUBCATEGORIA_VISUAL[compoundKey]
    }
  }

  return SUBCATEGORIA_VISUAL[subKey] ?? null
}
