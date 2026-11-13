import { useState } from 'react'
import { ArrowLeft, Check } from '@/components/ui/icons'
import { Button } from '@/components/ui'
import SegmentedControl from '@/components/ui/SegmentedControl'
import analisisService, {
  type BloqueInformeConfig,
  type ConfiguracionInforme,
  type InformePersonalizadoItem,
  type MonedaModoAnalisis,
  type NaturalezaGastoFiltro,
  type TipoBloqueInforme,
} from '@/services/analisis.service'
import { getErrorMessage } from '@/utils/errorMessages'
import { sileo } from 'sileo'
import styles from './MisInformesTab.module.css'

export { type TipoBloqueInforme }

export interface BloqueCatalogoItem {
  tipo: TipoBloqueInforme
  titulo: string
  descripcion: string
}

const CATALOGO_BLOQUES: BloqueCatalogoItem[] = [
  {
    tipo: 'kpis',
    titulo: 'Números principales',
    descripcion: 'Lo que entró, lo que salió y lo que te quedó.',
  },
  {
    tipo: 'evolucion_ciclos',
    titulo: 'Evolución Ciclo a Ciclo',
    descripcion: 'Lo que entró, lo que salió y lo que te quedó en cada ciclo.',
  },
  {
    tipo: 'desglose_categorias',
    titulo: 'Desglose por Categorías y Subcategorías',
    descripcion: 'En qué se fue la plata, hasta cada movimiento.',
  },
  {
    tipo: 'comparativa_ciclos',
    titulo: 'Comparar dos ciclos',
    descripcion: 'Qué cambió entre dos ciclos, rubro por rubro.',
  },
  {
    tipo: 'proyeccion_cuotas',
    titulo: 'Proyección de Tarjetas y Cuotas',
    descripcion: 'Lo que ya tenés comprometido en cuotas y suscripciones, y cuándo se te libera.',
  },
]

interface InformeEditorProps {
  initialInforme?: InformePersonalizadoItem | null
  onCancelar: () => void
  onGuardarExito: (guardado: InformePersonalizadoItem) => void
}

export default function InformeEditor({
  initialInforme,
  onCancelar,
  onGuardarExito,
}: InformeEditorProps) {
  const editingId = initialInforme?.id ?? null
  const cfg = initialInforme?.configuracion

  const [formNombre, setFormNombre] = useState<string>(
    initialInforme?.nombre ?? 'Informe Personalizado'
  )
  const [formDesc, setFormDesc] = useState<string>(
    initialInforme?.descripcion ?? (editingId ? '' : 'Análisis a medida de mis ciclos y categorías')
  )
  const [formMoneda, setFormMoneda] = useState<MonedaModoAnalisis>(
    cfg?.moneda_modo ?? 'solo_ars'
  )
  const [formCiclos, setFormCiclos] = useState<number>(cfg?.ciclos ?? 6)
  const [formNaturaleza, setFormNaturaleza] = useState<NaturalezaGastoFiltro>(
    cfg?.naturaleza ?? 'todos'
  )
  const [formBloques, setFormBloques] = useState<TipoBloqueInforme[]>(
    cfg?.bloques?.map((b) => b.tipo) ?? [
      'kpis',
      'evolucion_ciclos',
      'desglose_categorias',
      'comparativa_ciclos',
    ]
  )
  const [saving, setSaving] = useState<boolean>(false)

  const handleToggleBloque = (tipo: TipoBloqueInforme) => {
    setFormBloques((prev) => {
      if (prev.includes(tipo)) {
        if (prev.length <= 1) return prev
        return prev.filter((t) => t !== tipo)
      }
      return [...prev, tipo]
    })
  }

  const handleGuardarInforme = async () => {
    if (!formNombre.trim()) {
      sileo.error({ title: 'Ingresá un nombre para el informe.' })
      return
    }
    setSaving(true)
    const bloquesConfig: BloqueInformeConfig[] = formBloques.map((t, idx) => {
      const meta = CATALOGO_BLOQUES.find((c) => c.tipo === t)
      return {
        id: `bloque-${idx}-${t}`,
        tipo: t,
        titulo: meta?.titulo ?? t,
      }
    })
    const configuracion: ConfiguracionInforme = {
      moneda_modo: formMoneda,
      ciclos: formCiclos,
      naturaleza: formNaturaleza,
      bloques: bloquesConfig,
    }

    try {
      if (editingId) {
        const actualizado = await analisisService.updateInforme(editingId, {
          nombre: formNombre.trim(),
          descripcion: formDesc.trim() || null,
          configuracion,
        })
        sileo.success({ title: 'Informe actualizado.' })
        onGuardarExito(actualizado)
      } else {
        const creado = await analisisService.createInforme({
          nombre: formNombre.trim(),
          descripcion: formDesc.trim() || null,
          icono: 'pie-chart',
          configuracion,
        })
        sileo.success({ title: 'Informe guardado en tu cuenta.' })
        onGuardarExito(creado)
      }
    } catch (err) {
      sileo.error({ title: getErrorMessage(err, 'No pudimos guardar el informe.') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.builderCard} aria-label="Constructor de informe personalizado">
      <header className={styles.builderHeader}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onCancelar}
        >
          <ArrowLeft size={16} />
          <span>Volver a Mis Informes</span>
        </button>

        <h2 className={styles.builderTitle}>
          {editingId ? 'Editar Informe Personalizado' : 'Crear Nuevo Informe por Bloques'}
        </h2>
      </header>

      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="inf-nombre" className={styles.fieldLabel}>
            Nombre del informe
          </label>
          <input
            id="inf-nombre"
            type="text"
            className={styles.textInput}
            value={formNombre}
            onChange={(e) => setFormNombre(e.target.value)}
            placeholder="Ej: Cierre mensual familiar"
            maxLength={120}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="inf-desc" className={styles.fieldLabel}>
            Descripción (opcional)
          </label>
          <input
            id="inf-desc"
            type="text"
            className={styles.textInput}
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Ej: Seguimiento de gastos variables y tarjetas"
            maxLength={300}
          />
        </div>
      </div>

      <div className={styles.configRow}>
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Moneda por defecto</span>
          <SegmentedControl
            options={[
              { value: 'solo_ars', label: 'Pesos' },
              { value: 'solo_usd', label: 'Dólares' },
              { value: 'consolidado_ars', label: 'Todo pasado a pesos' },
              { value: 'consolidado_usd', label: 'Todo pasado a dólares' },
            ]}
            value={formMoneda}
            onChange={(v: string) => setFormMoneda(v as MonedaModoAnalisis)}
            ariaLabel="Moneda del informe"
            layout="wrap"
          />
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Cuántos ciclos ver</span>
          <SegmentedControl
            options={[
              { value: '1', label: 'Ciclo actual' },
              { value: '3', label: '3 ciclos' },
              { value: '6', label: '6 ciclos' },
              { value: '12', label: '12 ciclos' },
            ]}
            value={String(formCiclos)}
            onChange={(v: string) => setFormCiclos(Number(v))}
            ariaLabel="Cuántos ciclos ver en el informe"
            layout="inline"
          />
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Tipo de gasto</span>
          <SegmentedControl
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'variables', label: 'Día a día' },
              { value: 'fijos', label: 'Fijos y suscripciones' },
              { value: 'cuotas', label: 'Cuotas' },
            ]}
            value={formNaturaleza}
            onChange={(v: string) => setFormNaturaleza(v as NaturalezaGastoFiltro)}
            ariaLabel="Tipo de gasto del informe"
            layout="wrap"
          />
        </div>
      </div>

      <div className={styles.blocksPicker}>
        <span className={styles.fieldLabel}>
          Elegí qué bloques analíticos incluir en este informe ({formBloques.length}{' '}
          seleccionados)
        </span>

        <div className={styles.blocksGrid}>
          {CATALOGO_BLOQUES.map((b) => {
            const active = formBloques.includes(b.tipo)
            return (
              <button
                key={b.tipo}
                type="button"
                className={`${styles.blockOption} ${active ? styles.blockOptionActive : ''}`}
                onClick={() => handleToggleBloque(b.tipo)}
              >
                <div className={styles.blockCheck}>
                  {active && <Check size={14} />}
                </div>
                <div className={styles.blockTexts}>
                  <span className={styles.blockTitle}>{b.titulo}</span>
                  <span className={styles.blockDesc}>{b.descripcion}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <footer className={styles.builderFooter}>
        <Button variant="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button onClick={() => void handleGuardarInforme()} disabled={saving}>
          <Check size={16} />
          <span>{saving ? 'Guardando...' : 'Guardar y Abrir Informe'}</span>
        </Button>
      </footer>
    </section>
  )
}
