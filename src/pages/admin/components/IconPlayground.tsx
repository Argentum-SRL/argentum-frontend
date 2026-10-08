import { useState, useMemo } from 'react';
import {
  Transfer,
  Search,
  Wallet,
  CreditCard,
  Bell,
  Trash2,
  Copy,
  Pencil,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  ChartPie,
  Check,
  CircleCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Filter,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Star,
  Sparkles,
  DollarSign,
  Coins,
  Banknote,
  Save,
  Trophy,
  Globe,
  Mail,
  Download,
  Upload,
  Plus,
  Minus,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpDown,
  Activity,
  History,
  Layers,
  Home,
  LayoutDashboard,
  FileText,
  Archive,
  Phone,
  Smile,
  Users,
  User,
  UserCheck,
  UserX,
  LogOut,
  MoreHorizontal,
  MoreVertical,
  Play,
  Pause,
  PlayCircle,
  PauseCircle,
  Landmark,
  Building2,
  Camera,
  Receipt,
  Unlink,
  Link,
  Keyboard,
  GripHorizontal,
  MessageSquare,
  MessageCircle,
  MessageSquareOff,
  HelpCircle,
} from '@/components/ui/icons';
import type { MotionSignature } from '@/components/ui/icons/core/types';
import { MOTION_SIGNATURES } from '@/components/ui/icons/motion/signatures';

interface IconCatalogItem {
  id: string;
  name: string;
  concept: string;
  category: 'Finanzas' | 'Acciones' | 'Navegación' | 'Seguridad' | 'Sistema' | 'Feedback';
  signature: MotionSignature;
  Component: React.ComponentType<{
    size?: number | string;
    strokeWidth?: number | string;
    isHovered?: boolean;
    className?: string;
  }>;
}

const CATALOG: IconCatalogItem[] = [
  // Finanzas
  { id: 'transfer', name: 'Transfer / ArrowRightLeft', concept: 'Transferencia bancaria / flujo bidireccional', category: 'Finanzas', signature: 'directional-flow', Component: Transfer },
  { id: 'wallet', name: 'Wallet', concept: 'Billeteras y fondos disponibles', category: 'Finanzas', signature: 'wallet-clasp', Component: Wallet },
  { id: 'credit-card', name: 'CreditCard', concept: 'Tarjetas de crédito y débito', category: 'Finanzas', signature: 'card-glide', Component: CreditCard },
  { id: 'trending-up', name: 'TrendingUp', concept: 'Ingresos y rendimientos positivos', category: 'Finanzas', signature: 'trend-flow', Component: TrendingUp },
  { id: 'trending-down', name: 'TrendingDown', concept: 'Gastos y salidas de dinero', category: 'Finanzas', signature: 'trend-flow', Component: TrendingDown },
  { id: 'target', name: 'Target', concept: 'Metas de ahorro financiero', category: 'Finanzas', signature: 'ring-focus', Component: Target },
  { id: 'coins', name: 'Coins', concept: 'Monedas y cambio chico', category: 'Finanzas', signature: 'directional-flow', Component: Coins },
  { id: 'banknote', name: 'Banknote', concept: 'Efectivo / pagos contado', category: 'Finanzas', signature: 'bill-float', Component: Banknote },
  { id: 'dollar-sign', name: 'DollarSign', concept: 'Divisas y dólares', category: 'Finanzas', signature: 'directional-flow', Component: DollarSign },
  { id: 'receipt', name: 'Receipt', concept: 'Facturas y tickets fiscales', category: 'Finanzas', signature: 'paper-feed', Component: Receipt },
  { id: 'chart-pie', name: 'ChartPie / PieChart', concept: 'Distribución porcentual de presupuestos', category: 'Finanzas', signature: 'optical-sweep', Component: ChartPie },
  { id: 'landmark', name: 'Landmark', concept: 'Bancos e instituciones bancarias', category: 'Finanzas', signature: 'document-slide', Component: Landmark },
  { id: 'building-2', name: 'Building2', concept: 'Entidades y empresas', category: 'Finanzas', signature: 'document-slide', Component: Building2 },

  // Acciones
  { id: 'search', name: 'Search', concept: 'Búsqueda global y filtrado', category: 'Acciones', signature: 'optical-sweep', Component: Search },
  { id: 'trash', name: 'Trash2', concept: 'Eliminación destructiva de registros', category: 'Acciones', signature: 'lid-open', Component: Trash2 },
  { id: 'copy', name: 'Copy', concept: 'Copiar CBU, alias o ID', category: 'Acciones', signature: 'document-slide', Component: Copy },
  { id: 'pencil', name: 'Pencil / Edit', concept: 'Edición rápida de transacciones', category: 'Acciones', signature: 'pencil-sketch', Component: Pencil },
  { id: 'save', name: 'Save', concept: 'Guardar cambios y configuraciones', category: 'Acciones', signature: 'disk-click', Component: Save },
  { id: 'download', name: 'Download', concept: 'Descargar extractos y comprobantes', category: 'Acciones', signature: 'tray-drop', Component: Download },
  { id: 'upload', name: 'Upload', concept: 'Subir archivos y comprobantes', category: 'Acciones', signature: 'arrow-launch', Component: Upload },
  { id: 'plus', name: 'Plus', concept: 'Nueva transacción o registro', category: 'Acciones', signature: 'cross-rotate', Component: Plus },
  { id: 'minus', name: 'Minus', concept: 'Quitar o restar cuota', category: 'Acciones', signature: 'directional-nudge', Component: Minus },
  { id: 'x', name: 'X', concept: 'Cerrar modal o cancelar', category: 'Acciones', signature: 'cross-rotate', Component: X },
  { id: 'refresh-cw', name: 'RefreshCw', concept: 'Sincronizar saldos y cotizaciones', category: 'Acciones', signature: 'sync-spin', Component: RefreshCw },
  { id: 'rotate-ccw', name: 'RotateCcw / RefreshCcw', concept: 'Deshacer operación o reintentar', category: 'Acciones', signature: 'sync-spin', Component: RotateCcw },
  { id: 'filter', name: 'Filter', concept: 'Filtro embudo de transacciones', category: 'Acciones', signature: 'filter-slide', Component: Filter },
  { id: 'sliders', name: 'SlidersHorizontal', concept: 'Parámetros y filtros avanzados', category: 'Acciones', signature: 'filter-slide', Component: SlidersHorizontal },

  // Seguridad & Autenticación
  { id: 'shield', name: 'Shield', concept: 'Seguridad de cuenta', category: 'Seguridad', signature: 'alert-bounce', Component: Shield },
  { id: 'shield-check', name: 'ShieldCheck', concept: 'Verificación 2FA completada', category: 'Seguridad', signature: 'path-draw', Component: ShieldCheck },
  { id: 'shield-alert', name: 'ShieldAlert', concept: 'Aviso de seguridad o riesgo', category: 'Seguridad', signature: 'alert-bounce', Component: ShieldAlert },
  { id: 'lock', name: 'Lock', concept: 'Bloqueo de tarjetas y credenciales', category: 'Seguridad', signature: 'shackle-unlock', Component: Lock },
  { id: 'key', name: 'Key / KeyRound', concept: 'Llaves criptográficas y tokens', category: 'Seguridad', signature: 'gear-rotate', Component: Key },
  { id: 'eye', name: 'Eye', concept: 'Mostrar contraseña o saldo', category: 'Seguridad', signature: 'iris-blink', Component: Eye },
  { id: 'eye-off', name: 'EyeOff', concept: 'Ocultar contraseña o saldo', category: 'Seguridad', signature: 'iris-blink', Component: EyeOff },
  { id: 'unlink', name: 'Unlink', concept: 'Desvincular servicio externo', category: 'Seguridad', signature: 'document-slide', Component: Unlink },
  { id: 'link', name: 'Link', concept: 'Vincular cuenta bancaria', category: 'Seguridad', signature: 'document-slide', Component: Link },

  // Navegación
  { id: 'arrow-left', name: 'ArrowLeft', concept: 'Volver a la vista previa', category: 'Navegación', signature: 'arrow-thrust', Component: ArrowLeft },
  { id: 'arrow-right', name: 'ArrowRight', concept: 'Continuar paso siguiente', category: 'Navegación', signature: 'arrow-thrust', Component: ArrowRight },
  { id: 'arrow-up-right', name: 'ArrowUpRight', concept: 'Enlace externo / egreso', category: 'Navegación', signature: 'directional-flow', Component: ArrowUpRight },
  { id: 'arrow-down-left', name: 'ArrowDownLeft', concept: 'Entrada / ingreso', category: 'Navegación', signature: 'directional-flow', Component: ArrowDownLeft },
  { id: 'arrow-up-down', name: 'ArrowUpDown', concept: 'Ordenar o intercambiar', category: 'Navegación', signature: 'directional-flow', Component: ArrowUpDown },
  { id: 'chevron-left', name: 'ChevronLeft', concept: 'Página anterior', category: 'Navegación', signature: 'directional-nudge', Component: ChevronLeft },
  { id: 'chevron-right', name: 'ChevronRight', concept: 'Página siguiente', category: 'Navegación', signature: 'directional-nudge', Component: ChevronRight },
  { id: 'chevron-down', name: 'ChevronDown', concept: 'Desplegar acordeón', category: 'Navegación', signature: 'directional-nudge', Component: ChevronDown },
  { id: 'chevron-up', name: 'ChevronUp', concept: 'Plegar acordeón', category: 'Navegación', signature: 'directional-nudge', Component: ChevronUp },
  { id: 'home', name: 'Home', concept: 'Inicio / Vista general', category: 'Navegación', signature: 'document-slide', Component: Home },
  { id: 'layout-dashboard', name: 'LayoutDashboard', concept: 'Tablero de control principal', category: 'Navegación', signature: 'document-slide', Component: LayoutDashboard },

  // Sistema & Entorno
  { id: 'calendar', name: 'Calendar', concept: 'Selector de período y mes', category: 'Sistema', signature: 'calendar-flip', Component: Calendar },
  { id: 'clock', name: 'Clock', concept: 'Horarios y vencimientos', category: 'Sistema', signature: 'clock-tick', Component: Clock },
  { id: 'bell', name: 'Bell', concept: 'Campana de notificaciones', category: 'Sistema', signature: 'pendulum', Component: Bell },
  { id: 'sun', name: 'Sun', concept: 'Tema Modo Claro', category: 'Sistema', signature: 'sun-burst', Component: Sun },
  { id: 'moon', name: 'Moon', concept: 'Tema Modo Oscuro', category: 'Sistema', signature: 'moon-tilt', Component: Moon },
  { id: 'globe', name: 'Globe', concept: 'Internacional y divisas', category: 'Sistema', signature: 'globe-spin', Component: Globe },
  { id: 'activity', name: 'Activity', concept: 'Métricas en tiempo real', category: 'Sistema', signature: 'trend-flow', Component: Activity },
  { id: 'history', name: 'History', concept: 'Registro de auditoría', category: 'Sistema', signature: 'sync-spin', Component: History },
  { id: 'layers', name: 'Layers', concept: 'Grupos de cuotas', category: 'Sistema', signature: 'document-slide', Component: Layers },
  { id: 'file-text', name: 'FileText', concept: 'Resumen mensual PDF', category: 'Sistema', signature: 'document-slide', Component: FileText },
  { id: 'archive', name: 'Archive', concept: 'Registros archivados', category: 'Sistema', signature: 'lid-open', Component: Archive },
  { id: 'mail', name: 'Mail', concept: 'Correo y notificaciones push', category: 'Sistema', signature: 'envelope-open', Component: Mail },
  { id: 'phone', name: 'Phone', concept: 'Soporte y contacto WhatsApp', category: 'Sistema', signature: 'pendulum', Component: Phone },
  { id: 'camera', name: 'Camera', concept: 'Captura de comprobante', category: 'Sistema', signature: 'shutter-snap', Component: Camera },
  { id: 'keyboard', name: 'Keyboard', concept: 'Atajos de teclado', category: 'Sistema', signature: 'disk-click', Component: Keyboard },
  { id: 'grip-horizontal', name: 'GripHorizontal', concept: 'Reordenar widgets', category: 'Sistema', signature: 'directional-flow', Component: GripHorizontal },
  { id: 'log-out', name: 'LogOut', concept: 'Cerrar sesión segura', category: 'Sistema', signature: 'exit-door', Component: LogOut },

  // Feedback & Social
  { id: 'check', name: 'Check', concept: 'Operación confirmada', category: 'Feedback', signature: 'path-draw', Component: Check },
  { id: 'circle-check', name: 'CircleCheck / CheckCircle2', concept: 'Éxito verificado', category: 'Feedback', signature: 'path-draw', Component: CircleCheck },
  { id: 'alert-circle', name: 'AlertCircle', concept: 'Error o validación requerida', category: 'Feedback', signature: 'alert-bounce', Component: AlertCircle },
  { id: 'alert-triangle', name: 'AlertTriangle', concept: 'Precaución de saldo bajo', category: 'Feedback', signature: 'alert-bounce', Component: AlertTriangle },
  { id: 'info', name: 'Info', concept: 'Información y tooltips', category: 'Feedback', signature: 'info-nod', Component: Info },
  { id: 'help-circle', name: 'HelpCircle', concept: 'Centro de ayuda y dudas', category: 'Feedback', signature: 'info-nod', Component: HelpCircle },
  { id: 'star', name: 'Star', concept: 'Marcador de favoritos', category: 'Feedback', signature: 'star-sparkle', Component: Star },
  { id: 'sparkles', name: 'Sparkles', concept: 'Sugerencias inteligentes', category: 'Feedback', signature: 'star-sparkle', Component: Sparkles },
  { id: 'trophy', name: 'Trophy', concept: 'Objetivo de ahorro cumplido', category: 'Feedback', signature: 'trophy-lift', Component: Trophy },
  { id: 'smile', name: 'Smile', concept: 'Satisfacción y balance positivo', category: 'Feedback', signature: 'iris-blink', Component: Smile },
  { id: 'user', name: 'User', concept: 'Perfil individual', category: 'Feedback', signature: 'avatar-nod', Component: User },
  { id: 'users', name: 'Users', concept: 'Cuentas conjuntas y familia', category: 'Feedback', signature: 'avatar-nod', Component: Users },
  { id: 'user-check', name: 'UserCheck', concept: 'Contacto verificado', category: 'Feedback', signature: 'avatar-nod', Component: UserCheck },
  { id: 'user-x', name: 'UserX', concept: 'Usuario bloqueado', category: 'Feedback', signature: 'avatar-nod', Component: UserX },
  { id: 'message-square', name: 'MessageSquare', concept: 'Comentarios de movimientos', category: 'Feedback', signature: 'alert-bounce', Component: MessageSquare },
  { id: 'message-circle', name: 'MessageCircle', concept: 'Chat de soporte', category: 'Feedback', signature: 'alert-bounce', Component: MessageCircle },
  { id: 'message-square-off', name: 'MessageSquareOff', concept: 'Silenciar alertas', category: 'Feedback', signature: 'alert-bounce', Component: MessageSquareOff },
  { id: 'more-horizontal', name: 'MoreHorizontal', concept: 'Menú contextual de fila', category: 'Feedback', signature: 'stagger-wave', Component: MoreHorizontal },
  { id: 'more-vertical', name: 'MoreVertical', concept: 'Menú contextual de tarjeta', category: 'Feedback', signature: 'stagger-wave', Component: MoreVertical },
  { id: 'play', name: 'Play', concept: 'Reanudar suscripción', category: 'Feedback', signature: 'directional-flow', Component: Play },
  { id: 'pause', name: 'Pause', concept: 'Pausar débito automático', category: 'Feedback', signature: 'directional-flow', Component: Pause },
  { id: 'play-circle', name: 'PlayCircle', concept: 'Reproducir tutorial', category: 'Feedback', signature: 'directional-flow', Component: PlayCircle },
  { id: 'pause-circle', name: 'PauseCircle', concept: 'Pausar regla automática', category: 'Feedback', signature: 'directional-flow', Component: PauseCircle },
];

export function IconPlayground() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [iconSize, setIconSize] = useState<number>(24);
  const [iconStroke, setIconStroke] = useState<number>(2);
  const [replayTrigger, setReplayTrigger] = useState<number>(0);
  const [forceReducedMotion, setForceReducedMotion] = useState(false);

  const categories = ['Todas', 'Finanzas', 'Acciones', 'Seguridad', 'Navegación', 'Sistema', 'Feedback'];

  const filteredItems = useMemo(() => {
    return CATALOG.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.concept.toLowerCase().includes(search.toLowerCase()) ||
        item.signature.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  return (
    <div
      className="w-full max-h-[85vh] overflow-y-auto px-6 py-8 bg-background text-foreground"
      data-reduced-motion={forceReducedMotion ? 'true' : undefined}
    >
      {/* ── Coherence & Quality Assurance Banner ────────────────────────────── */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-silver-900/30 via-silver-800/20 to-silver-900/30 border border-silver-400/20 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 rounded-full">
                Argentum Icon System · Calidad Animate UI
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                100% SVG Vectorial
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full">
                Cero Scale/Pop en Wrapper
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              Catálogo de Iconografía Animada e Inspección de Movimiento
            </h1>
            <p className="text-sm text-silver-400 max-w-3xl">
              Cada icono posee geometría Lucide normalizada (viewBox 24x24, stroke 2px, stroke-linecap round),
              animaciones internas a nivel de path/group/stroke con Motion y detección automática de hover en
              botones contenedores sin depender de estado local ni transformaciones genéricas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReplayTrigger((prev) => prev + 1)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-lg shadow-primary/20"
            >
              Replay Global (Disparar Todos)
            </button>
            <button
              type="button"
              onClick={() => setForceReducedMotion((prev) => !prev)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
                forceReducedMotion
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-silver-800/40 border-silver-600/30 text-silver-300 hover:bg-silver-800/70'
              }`}
            >
              {forceReducedMotion ? 'Reduced Motion: ON' : 'Reduced Motion: OFF'}
            </button>
          </div>
        </div>

        {/* ── Visual System Consistency Metrics ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-silver-700/30 text-xs">
          <div>
            <div className="text-silver-400">Total en Catálogo</div>
            <div className="text-lg font-bold text-white">{CATALOG.length} Iconos Especializados</div>
          </div>
          <div>
            <div className="text-silver-400">Geometría Normalizada</div>
            <div className="text-lg font-bold text-white">24 × 24 · viewBox Uniforme</div>
          </div>
          <div>
            <div className="text-silver-400">Herencia de Color</div>
            <div className="text-lg font-bold text-emerald-400">currentColor (CSS Compatible)</div>
          </div>
          <div>
            <div className="text-silver-400">Detección de Contenedor</div>
            <div className="text-lg font-bold text-blue-400">Parent-Hover Automático</div>
          </div>
        </div>
      </div>

      {/* ── Filters & Controls Toolbar ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                selectedCategory === cat
                  ? 'bg-white text-black font-semibold shadow'
                  : 'bg-silver-900/60 text-silver-400 hover:bg-silver-850 hover:text-white border border-silver-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, concepto o motion signature..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 text-xs rounded-xl bg-silver-900/80 border border-silver-700/40 text-white placeholder-silver-500 focus:outline-none focus:border-primary w-64"
          />

          <div className="flex items-center gap-1.5 text-xs text-silver-400 bg-silver-900/60 px-3 py-1.5 rounded-xl border border-silver-800">
            <span>Tamaño:</span>
            {[20, 24, 32].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setIconSize(s)}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  iconSize === s ? 'bg-primary text-white font-bold' : 'hover:text-white'
                }`}
              >
                {s}px
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-silver-400 bg-silver-900/60 px-3 py-1.5 rounded-xl border border-silver-800">
            <span>Stroke:</span>
            {[1.5, 2, 2.5].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setIconStroke(w)}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  iconStroke === w ? 'bg-primary text-white font-bold' : 'hover:text-white'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Icon Cards Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const signatureMeta = MOTION_SIGNATURES[item.signature];
          const IconComp = item.Component;

          return (
            <div
              key={`${item.id}-${replayTrigger}`}
              className="p-4 rounded-xl bg-silver-900/40 border border-silver-800/60 hover:border-silver-600/40 transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white tracking-wide">{item.name}</span>
                    <span className="text-[11px] text-silver-400 line-clamp-1">{item.concept}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-silver-800/80 text-silver-300 border border-silver-700/40 shrink-0">
                    {item.category}
                  </span>
                </div>

                {/* Icon stage center with isolated hover testing */}
                <div className="h-24 rounded-lg bg-black/30 border border-silver-800/40 flex items-center justify-center mb-3 group/stage relative">
                  <div className="p-3 rounded-lg hover:bg-white/5 transition flex items-center justify-center cursor-pointer">
                    <IconComp
                      size={iconSize}
                      strokeWidth={iconStroke}
                      className="text-silver-200 transition-colors group-hover/stage:text-white"
                    />
                  </div>
                  <span className="absolute bottom-1 right-2 text-[9px] text-silver-500 font-mono">
                    hover me
                  </span>
                </div>
              </div>

              <div>
                {/* Motion Signature & Description */}
                <div className="p-2 rounded-lg bg-silver-950/60 border border-silver-800/40 mb-3 text-[11px]">
                  <div className="flex items-center justify-between text-silver-400 mb-0.5">
                    <span className="font-mono text-primary text-[10px]">{item.signature}</span>
                    <span className="text-[9px] text-silver-400">{signatureMeta?.category || 'Custom'}</span>
                  </div>
                  <p className="text-[10px] text-silver-400 leading-tight">
                    {signatureMeta?.description || 'Animación SVG interna'}
                  </p>
                </div>

                {/* Parent Hover Live Test Button */}
                <button
                  type="button"
                  className="w-full group/btn flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-silver-800/50 hover:bg-primary/20 border border-silver-700/40 hover:border-primary/40 text-silver-300 hover:text-white text-xs font-medium transition cursor-pointer"
                  title="Hover sobre todo este botón dispara la animación del icono automáticamente sin hooks locales"
                >
                  <IconComp size={16} strokeWidth={iconStroke} className="text-silver-400 group-hover/btn:text-primary transition" />
                  <span>Probar en Botón (Parent Hover)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-16 text-center text-silver-400">
          <p className="text-base font-medium mb-1">No se encontraron iconos que coincidan con la búsqueda</p>
          <p className="text-xs text-silver-500">Probá con otro término o seleccioná la categoría "Todas"</p>
        </div>
      )}
    </div>
  );
}
