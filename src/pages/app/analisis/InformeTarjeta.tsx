import { Edit3, FileSpreadsheet, Trash2, Eye, Copy, Sparkles, TrendingUp, Calendar, ArrowRight } from '@/components/ui/icons'
import type { InformePersonalizadoItem } from '@/services/analisis.service'
import type { PlantillaRapidaItem } from './plantillasInforme'
import styles from './MisInformesTab.module.css'

const MAPA_BLOQUES_NOMBRES: Record<string, string> = {
  kpis: 'Balance',
  evolucion_ciclos: 'Evolución',
  desglose_categorias: 'Categorías',
  comparativa_ciclos: 'Comparativa',
  proyeccion_cuotas: 'Cuotas',
}

function formatModoMonedaBadge(modo?: string): string {
  switch (modo) {
    case 'solo_ars':
      return 'Pesos'
    case 'solo_usd':
      return 'Dólares'
    case 'consolidado_ars':
      return 'Pasado a pesos'
    case 'consolidado_usd':
      return 'Pasado a dólares'
    default:
      return 'Pesos'
  }
}

function getTemplateIcon(id: string) {
  switch (id) {
    case 'tpl-cierre-ciclo':
      return <Sparkles size={18} />
    case 'tpl-variables-hormiga':
      return <TrendingUp size={18} />
    case 'tpl-tarjetas-cuotas':
      return <Calendar size={18} />
    default:
      return <Sparkles size={18} />
  }
}

interface InformeTarjetaProps {
  informe: InformePersonalizadoItem
  onEditar: (inf: InformePersonalizadoItem) => void
  onEliminar: (id: string) => void
  onAbrir: (inf: InformePersonalizadoItem) => void
}

export default function InformeTarjeta({
  informe,
  onEditar,
  onEliminar,
  onAbrir,
}: InformeTarjetaProps) {
  const bloques = informe.configuracion.bloques ?? []

  return (
    <article
      className={styles.reportCard}
      onClick={() => onAbrir(informe)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onAbrir(informe)
        }
      }}
      aria-label={`Abrir informe ${informe.nombre}`}
    >
      <div className={styles.reportCardHeader}>
        <div className={styles.reportHeaderLeft}>
          <div className={styles.reportIconBox}>
            <FileSpreadsheet size={18} />
          </div>
          <div className={styles.reportTitleBlock}>
            <h3 className={styles.reportName}>{informe.nombre}</h3>
            <p className={styles.reportDesc}>
              {informe.descripcion || 'Informe personalizado por bloques'}
            </p>
          </div>
        </div>

        <div className={styles.reportCardActions} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.iconActionBtn}
            onClick={(e) => {
              e.stopPropagation()
              onEditar(informe)
            }}
            aria-label="Editar informe"
            title="Editar informe"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            className={styles.iconActionBtnDanger}
            onClick={(e) => {
              e.stopPropagation()
              onEliminar(informe.id)
            }}
            aria-label="Eliminar informe"
            title="Eliminar informe"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className={styles.reportCardMeta}>
        <div className={styles.badgesRow}>
          <span className={styles.metaBadge}>
            {informe.configuracion.ciclos ?? 6} ciclos
          </span>
          <span className={styles.metaBadge}>
            {formatModoMonedaBadge(informe.configuracion.moneda_modo)}
          </span>
          {informe.configuracion.naturaleza && informe.configuracion.naturaleza !== 'todos' && (
            <span className={styles.metaBadge}>
              {informe.configuracion.naturaleza === 'variables'
                ? 'Día a día'
                : informe.configuracion.naturaleza === 'fijos'
                  ? 'Fijos'
                  : 'Cuotas'}
            </span>
          )}
          <span className={styles.metaBadgeMuted}>
            {bloques.length} {bloques.length === 1 ? 'bloque' : 'bloques'}
          </span>
        </div>

        {bloques.length > 0 && (
          <div className={styles.blockChipsPreview}>
            <span className={styles.blockChipsLabel}>Módulos:</span>
            {bloques.map((b) => (
              <span key={b.tipo} className={styles.blockMiniChip}>
                {MAPA_BLOQUES_NOMBRES[b.tipo] ?? b.titulo}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.reportCardFooter}>
        <button
          type="button"
          className={styles.openReportBtn}
          onClick={(e) => {
            e.stopPropagation()
            onAbrir(informe)
          }}
        >
          <span>Abrir informe</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  )
}

interface PlantillaTarjetaProps {
  plantilla: PlantillaRapidaItem
  onVerAhora: (tpl: PlantillaRapidaItem) => void
  onGuardarCopia: (tpl: PlantillaRapidaItem) => void
}

export function PlantillaTarjeta({
  plantilla,
  onVerAhora,
  onGuardarCopia,
}: PlantillaTarjetaProps) {
  const bloques = plantilla.configuracion.bloques ?? []

  return (
    <article
      className={styles.templateCard}
      onClick={() => onVerAhora(plantilla)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onVerAhora(plantilla)
        }
      }}
      aria-label={`Ver plantilla ${plantilla.nombre}`}
    >
      <div className={styles.reportCardHeader}>
        <div className={styles.reportHeaderLeft}>
          <div className={styles.templateIconBox}>
            {getTemplateIcon(plantilla.id)}
          </div>
          <div className={styles.reportTitleBlock}>
            <h4 className={styles.reportName}>{plantilla.nombre}</h4>
            <p className={styles.reportDesc}>{plantilla.descripcion}</p>
          </div>
        </div>
      </div>

      <div className={styles.reportCardMeta}>
        <div className={styles.badgesRow}>
          <span className={styles.metaBadge}>{plantilla.configuracion.ciclos} ciclos</span>
          <span className={styles.metaBadgeMuted}>
            {bloques.length} {bloques.length === 1 ? 'bloque' : 'bloques'}
          </span>
        </div>

        {bloques.length > 0 && (
          <div className={styles.blockChipsPreview}>
            <span className={styles.blockChipsLabel}>Módulos:</span>
            {bloques.map((b) => (
              <span key={b.tipo} className={styles.blockMiniChip}>
                {MAPA_BLOQUES_NOMBRES[b.tipo] ?? b.titulo}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.templateBtns} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.templateBtnSecondary}
          onClick={(e) => {
            e.stopPropagation()
            onVerAhora(plantilla)
          }}
        >
          <Eye size={14} />
          <span>Ver</span>
        </button>
        <button
          type="button"
          className={styles.templateBtnPrimary}
          onClick={(e) => {
            e.stopPropagation()
            onGuardarCopia(plantilla)
          }}
        >
          <Copy size={14} />
          <span>Guardar plantilla</span>
        </button>
      </div>
    </article>
  )
}
