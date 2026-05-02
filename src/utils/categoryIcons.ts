import {
  ShoppingCart, Home, Zap, Heart, Smile,
  GraduationCap, Music, Shirt, Cpu, DollarSign,
  Shield, Receipt, PawPrint, Briefcase, Gift,
  MoreHorizontal, UtensilsCrossed, Bus, Flame,
  Wifi, Stethoscope, Dumbbell, BookOpen, Tv,
  Laptop, CreditCard, Car, Building2, Wrench,
  FlaskConical, Scissors, Clapperboard, Gamepad2,
  Package, TrendingUp, Landmark, ArrowDownCircle
} from 'lucide-react'

export const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; color?: string }>> = {

  // ── Categorias padre ────────────────────────────────
  'Alimentación':          UtensilsCrossed,
  'Transporte':            Car,
  'Vivienda':              Home,
  'Servicios':             Zap,
  'Salud':                 Stethoscope,
  'Bienestar':             Heart,
  'Educación':             GraduationCap,
  'Entretenimiento':       Music,
  'Ropa e indumentaria':   Shirt,
  'Tecnología':            Laptop,
  'Finanzas':              TrendingUp,
  'Seguros':               Shield,
  'Impuestos':             Landmark,
  'Mascotas':              PawPrint,
  'Ingresos':              ArrowDownCircle,
  'Regalos y donaciones':  Gift,
  'Otros':                 MoreHorizontal,

  // ── Subcategorias: Alimentacion ─────────────────────
  'Supermercado':          ShoppingCart,
  'Verdulería':            ShoppingCart,
  'Carnicería':            ShoppingCart,
  'Restaurante':           UtensilsCrossed,
  'Delivery':              Package,
  'Cafetería':             UtensilsCrossed,

  // ── Subcategorias: Transporte ────────────────────────
  'Combustible':           Flame,
  'Transporte público':    Bus,
  'Taxi / Remis / Uber':   Car,
  'Peaje':                 Receipt,
  'Estacionamiento':       Car,
  'Mantenimiento vehículo': Wrench,

  // ── Subcategorias: Vivienda ──────────────────────────
  'Alquiler':              Building2,
  'Expensas':              Building2,
  'Mantenimiento / Reparaciones': Wrench,
  'Muebles':               Home,
  'Limpieza':              Home,

  // ── Subcategorias: Servicios ─────────────────────────
  'Electricidad':          Zap,
  'Gas':                   Flame,
  'Agua':                  Zap,
  'Internet':              Wifi,
  'Teléfono':              Wifi,
  'Cable / TV':            Tv,

  // ── Subcategorias: Salud ─────────────────────────────
  'Farmacia':              FlaskConical,
  'Médico / Consulta':     Stethoscope,
  'Obra social / Seguro médico': Shield,
  'Estudios / Análisis':   FlaskConical,

  // ── Subcategorias: Bienestar ─────────────────────────
  'Gimnasio':              Dumbbell,
  'Terapia':               Heart,
  'Estética / Peluquería': Scissors,
  'Spa / Cuidado personal': Smile,

  // ── Subcategorias: Educacion ─────────────────────────
  'Cursos':                GraduationCap,
  'Libros':                BookOpen,
  'Materiales':            BookOpen,
  'Cuotas educativas':     GraduationCap,

  // ── Subcategorias: Entretenimiento ──────────────────
  'Streaming':             Tv,
  'Cine / Teatro':         Clapperboard,
  'Juegos':                Gamepad2,
  'Salidas / Bares':       Music,

  // ── Subcategorias: Ropa ──────────────────────────────
  'Ropa':                  Shirt,
  'Calzado':               Shirt,
  'Accesorios':            Shirt,

  // ── Subcategorias: Tecnologia ────────────────────────
  'Dispositivos':          Laptop,
  'Software / Apps':       Cpu,
  'Suscripciones digitales': Cpu,
  'Reparaciones':          Wrench,

  // ── Subcategorias: Finanzas ──────────────────────────
  'Comisiones bancarias':  CreditCard,
  'Intereses':             TrendingUp,
  'Tarjetas de crédito':   CreditCard,
  'Inversiones':           TrendingUp,
  'Préstamos':             DollarSign,

  // ── Subcategorias: Seguros ───────────────────────────
  'Seguro auto':           Shield,
  'Seguro hogar':          Shield,
  'Seguro vida':           Shield,

  // ── Subcategorias: Impuestos ─────────────────────────
  'Impuestos nacionales':  Landmark,
  'Impuestos provinciales': Landmark,
  'Impuestos municipales': Landmark,

  // ── Subcategorias: Mascotas ──────────────────────────
  'Alimento mascotas':     PawPrint,
  'Veterinario':           PawPrint,
  // 'Accesorios':            Package, // Duplicate key with Ropa

  // ── Subcategorias: Ingresos ──────────────────────────
  'Sueldo':                Briefcase,
  'Freelance':             Briefcase,
  'Ventas':                DollarSign,
  'Otros ingresos':        ArrowDownCircle,

  // ── Subcategorias: Regalos ───────────────────────────
  'Regalos':               Gift,
  'Donaciones':            Gift,

  // ── General ──────────────────────────────────────────
  'General':               MoreHorizontal,
}

export function getCategoryIcon(nombre: string) {
  return CATEGORY_ICONS[nombre] ?? MoreHorizontal
}
