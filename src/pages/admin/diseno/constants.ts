import type React from 'react'
import {
  Layers,
  CreditCard,
  MessageSquare,
  Info,
  DollarSign,
  Settings,
} from '@/components/ui/icons'
import {
  CheckSquare,
  MousePointerClick,
  Type,
  Sliders,
  Compass,
  Loader2,
} from 'lucide-react'

export interface CategoryMeta {
  id: string
  name: string
  count: number
  icon: React.ComponentType<{ size?: number; className?: string }>
  description: string
}

export const CATEGORIES_CONFIG: CategoryMeta[] = [
  { id: 'selectores_segmentados', name: 'Pestañas y Selectores', count: 41, icon: Layers, description: 'Botones en fila para alternar entre opciones (ej: Egreso/Ingreso, Mes/Año).' },
  { id: 'opciones_seleccionables', name: 'Tarjetas de Selección', count: 82, icon: CheckSquare, description: 'Tarjetas clickeables para elegir opciones (ej: Débito/Crédito, Renovación automática).' },
  { id: 'botones_accion', name: 'Botones Principales', count: 533, icon: MousePointerClick, description: 'Botones para guardar, cancelar, confirmar o borrar acciones.' },
  { id: 'campos_entrada', name: 'Campos e Importes ($)', count: 163, icon: Type, description: 'Casillas para escribir texto y el teclado especial de ingreso de dinero.' },
  { id: 'seleccion_avanzada', name: 'Selectores Especiales', count: 7, icon: Sliders, description: 'Menús para elegir categoría con icono, país telefónico y selector de color.' },
  { id: 'tarjetas_paneles', name: 'Tarjetas y Listas', count: 350, icon: CreditCard, description: 'Cómo se ven las tarjetas de tus billeteras y las filas de movimientos.' },
  { id: 'modales_dialogos', name: 'Ventanas Emergentes', count: 1712, icon: MessageSquare, description: 'Ventanas que se abren sobre la pantalla para crear gastos o confirmar acciones.' },
  { id: 'navegacion', name: 'Menús y Navegación', count: 24, icon: Compass, description: 'Barras de navegación, filtros y cambio de pantallas principales.' },
  { id: 'elementos_informativos', name: 'Avisos y Etiquetas', count: 195, icon: Info, description: 'Etiquetas de colores, alertas en pantalla y notificaciones flotantes.' },
  { id: 'estados_interfaz', name: 'Pantallas de Carga y Vacías', count: 140, icon: Loader2, description: 'El círculo lunar cuando la app carga y la pantalla de "No hay datos".' },
  { id: 'elementos_financieros', name: 'Montos y Saldos', count: 85, icon: DollarSign, description: 'Formato visual de números, pesos ($) y dólares (USD).' },
  { id: 'controles_especiales', name: 'Ajustes Especiales', count: 22, icon: Settings, description: 'Configuración del ciclo financiero y opciones avanzadas de administración.' },
]
