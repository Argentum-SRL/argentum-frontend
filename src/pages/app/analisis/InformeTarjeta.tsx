import { Edit3, FileSpreadsheet, Trash2, Eye, Copy, Sparkles, TrendingUp, Calendar } from '@/components/ui/icons'
import { Button } from '@/components/ui'
import type { InformePersonalizadoItem } from '@/services/analisis.service'
import type { PlantillaRapidaItem } from './plantillasInforme'
import styles from './MisInformesTab.module.css'

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
  return (
    <article className={styles.reportCard}>
      <div className={styles.reportCardTop}>
        <div className={styles.reportIconBox}>
          <FileSpreadsheet size={18} />
        </div>
        <div className={styles.reportCardActions}>
          <button
            type="button"
            className={styles.iconActionBtn}
            onClick={() => onEditar(informe)}
            aria-label="Editar informe"
            title="Editar bloques"
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            className={styles.iconActionBtnDanger}
            onClick={() => onEliminar(informe.id)}
            aria-label="Eliminar informe"
            title="Eliminar informe"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <h3 className={styles.reportName}>{informe.nombre}</h3>
      <p className={styles.reportDesc}>
        {informe.descripcion || 'Informe personalizado por bloques'}
      </p>

      <div className={styles.badgesRow}>
        <span className={styles.metaBadge}>
          {informe.configuracion.ciclos ?? 6} ciclos
        </span>
        <span className={styles.metaBadge}>
          {formatModoMonedaBadge(informe.configuracion.moneda_modo)}
        </span>
        <span className={styles.metaBadge}>
          {informe.configuracion.bloques?.length ?? 0} bloques
        </span>
      </div>

      <Button onClick={() => onAbrir(informe)}>
        Abrir Informe
      </Button>
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
  return (
    <article className={styles.templateCard}>
      <div className={styles.templateCardTop}>
        <div className={styles.templateIconBox}>
          {getTemplateIcon(plantilla.id)}
        </div>
        <div className={styles.badgesRow}>
          <span className={styles.metaBadge}>{plantilla.configuracion.ciclos} ciclos</span>
          <span className={styles.metaBadge}>
            {plantilla.configuracion.bloques.length} bloques
          </span>
        </div>
      </div>

      <h4 className={styles.reportName}>{plantilla.nombre}</h4>
      <p className={styles.reportDesc}>{plantilla.descripcion}</p>

      <div className={styles.templateBtns}>
        <button
          type="button"
          className={styles.templateBtnSecondary}
          onClick={() => onVerAhora(plantilla)}
        >
          <Eye size={14} />
          <span>Ver</span>
        </button>
        <button
          type="button"
          className={styles.templateBtnPrimary}
          onClick={() => onGuardarCopia(plantilla)}
        >
          <Copy size={14} />
          <span>Guardar plantilla</span>
        </button>
      </div>
    </article>
  )
}
