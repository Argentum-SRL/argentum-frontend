import { memo, useState, useMemo } from 'react'
import { SlidersHorizontal, Plus, Minus } from '@/components/ui/icons'
import { formatMonto } from '@/utils/format'
import type { ResumenDeCompraResponse, PlanCuotas } from '@/types'
import { useSimularCuotas } from '@/hooks/useSimularCuotas'
import ResumenDeCompraInfo from './ResumenDeCompraInfo'
import styles from './TransaccionModal.module.css'

interface CalculoCuotasResumenProps {
  cantidadCuotas: number
  cuotaInicial: number
  tasaInteres: number
  proximoResumen: boolean
  monto: number | null
  moneda: string
  resumenCompra: ResumenDeCompraResponse | null
  loadingResumenCompra: boolean
  errorResumenCompra: boolean
  vencimientoDDMM: string
  onFieldChange: {
    (field: 'proximoResumen', value: boolean): void
    (field: 'cantidadCuotas' | 'cuotaInicial' | 'tasaInteres', value: number): void
  }
}

export const CalculoCuotasResumen = memo(function CalculoCuotasResumen({
  cantidadCuotas,
  cuotaInicial,
  tasaInteres,
  proximoResumen,
  monto,
  moneda,
  resumenCompra,
  loadingResumenCompra,
  errorResumenCompra,
  vencimientoDDMM,
  onFieldChange,
}: CalculoCuotasResumenProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isCustomOverride, setIsCustomOverride] = useState(false)
  const isCustomCuotas = isCustomOverride || ![1, 3, 6, 12].includes(cantidadCuotas)

  const cantidades = useMemo(() => {
    const base = [3, 6, 12]
    if (cantidadCuotas && !base.includes(cantidadCuotas)) {
      return [...base, cantidadCuotas]
    }
    return base
  }, [cantidadCuotas])

  const { simulacion, error } = useSimularCuotas({
    montoTotal: monto,
    cantidades,
    tasaTna: tasaInteres > 0 ? tasaInteres : null,
    enabled: Boolean(monto && monto > 0),
  })

  const planMap = useMemo(() => {
    const map = new Map<number, PlanCuotas>()
    if (simulacion?.planes) {
      for (const p of simulacion.planes) {
        map.set(p.cantidad_cuotas, p)
      }
    }
    return map
  }, [simulacion])

  const currentPlan = planMap.get(cantidadCuotas)

  return (
    <div className={`${styles.formFields} ${styles.financiacionContainer}`}>
      {/* 1. Selector de Cantidad de Cuotas (Presets primarios + Otra) */}
      <div className={styles.planSelectorSection}>
        <label className={styles.fieldLabel}>¿En cuántas cuotas?</label>
        <div className={styles.planGrid}>
          {[1, 3, 6, 12].map((n) => {
            const isSelected = !isCustomCuotas && cantidadCuotas === n
            const planN = planMap.get(n)
            return (
              <button
                type="button"
                key={n}
                className={`${styles.planOptionCard} ${isSelected ? styles.planOptionCardActive : ''}`}
                onClick={() => {
                  setIsCustomOverride(false)
                  onFieldChange('cantidadCuotas', n)
                  if (cuotaInicial > n) {
                    onFieldChange('cuotaInicial', 1)
                  }
                }}
              >
                <span className={styles.planCuotasNum}>{n}</span>
                <span className={styles.planCuotasLbl}>{n === 1 ? 'pago' : 'cuotas'}</span>
                {n > 1 && monto && planN ? (
                  <span className={styles.planCuotasAmt}>
                    {formatMonto(planN.monto_cuota, moneda)}/mes
                  </span>
                ) : null}
              </button>
            )
          })}

          <button
            type="button"
            className={`${styles.planCustomBtn} ${isCustomCuotas ? styles.planCustomBtnActive : ''}`}
            onClick={() => {
              if (!isCustomCuotas) {
                setIsCustomOverride(true)
                const nextVal = [1, 3, 6, 12].includes(cantidadCuotas) ? 18 : cantidadCuotas
                onFieldChange('cantidadCuotas', nextVal)
              }
            }}
          >
            <span className={styles.planCustomBtnLabel}>
              {isCustomCuotas ? `${cantidadCuotas} cuotas` : 'Otra...'}
            </span>
          </button>
        </div>

        {/* Stepper inline al elegir cantidad personalizada */}
        {isCustomCuotas && (
          <div className={styles.customStepperRow}>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => {
                const val = Math.max(1, cantidadCuotas - 1)
                onFieldChange('cantidadCuotas', val)
                if (cuotaInicial > val) onFieldChange('cuotaInicial', 1)
              }}
              disabled={cantidadCuotas <= 1}
              aria-label="Menos cuotas"
            >
              <Minus size={14} />
            </button>
            <span className={styles.stepperValue}>
              {cantidadCuotas} {cantidadCuotas === 1 ? 'pago' : 'cuotas'}
            </span>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => {
                const val = Math.min(120, cantidadCuotas + 1)
                onFieldChange('cantidadCuotas', val)
              }}
              disabled={cantidadCuotas >= 120}
              aria-label="Más cuotas"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Resumen de compra */}
      <ResumenDeCompraInfo
        resumen={resumenCompra}
        loading={loadingResumenCompra}
        error={errorResumenCompra}
        proximoResumen={proximoResumen}
        onChangeProximoResumen={(value) => onFieldChange('proximoResumen', value)}
      />

      {/* 3. Opciones avanzadas (Progressive disclosure: Interés y cuotas ya pagadas) */}
      {cantidadCuotas > 1 && (
        <>
          <button
            type="button"
            className={styles.advancedToggleBtn}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal size={13} />
            <span>{showAdvanced ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas (interés o cuota actual)'}</span>
          </button>

          {showAdvanced && (
            <div className={styles.advancedDrawer}>
              <div className={styles.advField}>
                <label className={styles.advLabel}>Interés anual (TNA %)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={3000}
                  placeholder="0% (Sin interés)"
                  value={tasaInteres === 0 ? '' : tasaInteres}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    onFieldChange('tasaInteres', val)
                  }}
                  className={styles.advInput}
                />
              </div>
              <div className={styles.advField}>
                <label className={styles.advLabel}>Voy por la cuota</label>
                <input
                  type="number"
                  min={1}
                  max={cantidadCuotas}
                  value={cuotaInicial || 1}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 1 : Math.max(1, Math.min(cantidadCuotas, parseInt(e.target.value) || 1))
                    onFieldChange('cuotaInicial', val)
                  }}
                  className={styles.advInput}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* 4. Tarjeta Hero de Resumen */}
      <div className={styles.heroFinancingCard}>
        <div className={styles.heroFinancingTop}>
          <div>
            <span className={styles.heroInstallmentAmount}>
              {currentPlan
                ? formatMonto(currentPlan.monto_cuota, moneda)
                : error
                  ? 'No se pudo calcular'
                  : 'Calculando…'}
            </span>
            <span className={styles.heroInstallmentSuffix}>
              {cantidadCuotas === 1 ? ' pago único' : '/mes'}
            </span>
          </div>
          {cantidadCuotas > 1 && tasaInteres > 0 && currentPlan && (
            <div className={styles.heroTotalBadge}>
              Total: {formatMonto(currentPlan.total_financiado, moneda)}
            </div>
          )}
        </div>

        <p className={styles.heroFinancingNarrative}>
          {cantidadCuotas === 1 ? (
            <>
              Se carga en {vencimientoDDMM ? <>el resumen que vence el <strong>{vencimientoDDMM}</strong></> : <strong>el próximo resumen</strong>}.
            </>
          ) : cuotaInicial > 1 ? (
            <>
              Pagarás <strong>{cantidadCuotas - cuotaInicial + 1} de {cantidadCuotas} cuotas</strong> a partir del {vencimientoDDMM ? <>resumen que vence el <strong>{vencimientoDDMM}</strong></> : <strong>próximo resumen</strong>}.
            </>
          ) : (
            <>
              Pagarás <strong>{cantidadCuotas} cuotas</strong> {tasaInteres > 0 ? `(con ${tasaInteres}% TNA)` : '(sin interés)'}, empezando en {vencimientoDDMM ? <>el resumen que vence el <strong>{vencimientoDDMM}</strong></> : <strong>el próximo resumen</strong>}.
            </>
          )}
        </p>
      </div>
    </div>
  )
})

export default CalculoCuotasResumen
