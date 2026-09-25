import React, { useState } from 'react'
import { guardarCicloFinanciero } from '@/services/onboarding.service'
import { invalidateDashboardCache } from '@/services/dashboard.service'
import { Button } from '@/components/ui'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import { CicloFinancieroSelector, type CicloValue } from '@/components/ciclo/CicloFinancieroSelector'
import styles from './StepCicloFinanciero.module.css'

interface Props {
  datosIniciales: {
    ciclo_tipo: string | null
    ciclo_valor: string | null
    ciclo_ajuste_direccion?: string | null
  }
  onNext: (siguientePaso: string | null) => void
}

export default function StepCicloFinanciero({ datosIniciales, onNext }: Props) {
  const initialTipo = (datosIniciales.ciclo_tipo as 'dia_fijo' | 'regla') || 'dia_fijo'
  const initialValor = datosIniciales.ciclo_valor || (initialTipo === 'dia_fijo' ? '1' : 'dia_habil_4')
  const initialDir = initialTipo === 'regla'
    ? null
    : ((datosIniciales.ciclo_ajuste_direccion as 'anterior' | 'posterior' | null) ?? 'anterior')

  const [ciclo, setCiclo] = useState<CicloValue>({
    tipo: initialTipo,
    valor: initialValor,
    direccion: initialDir,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (ciclo.tipo === 'dia_fijo') {
      const diaNum = parseInt(ciclo.valor, 10)
      if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
        setError('El día de corte debe ser un número entero entre 1 y 31.')
        return
      }
    } else if (ciclo.tipo === 'regla') {
      if (!ciclo.valor) {
        setError('Seleccioná un día hábil válido.')
        return
      }
    }

    setLoading(true)
    try {
      const res = await guardarCicloFinanciero({
        ciclo_tipo: ciclo.tipo,
        ciclo_valor: ciclo.valor,
        ciclo_ajuste_direccion: ciclo.tipo === 'regla' ? null : ciclo.direccion,
      })
      invalidateDashboardCache()
      onNext(res.siguiente_paso)
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No pudimos guardar tus preferencias. Intentá de nuevo.')
      setError(msg)
      sileo.error({ title: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className={styles.title}>Tu ciclo financiero</h2>
      <p className={styles.subtitle}>¿Cuándo empezás a contar tus gastos del mes?</p>

      <form onSubmit={handleSubmit} noValidate>
        <CicloFinancieroSelector
          value={ciclo}
          onChange={setCiclo}
          disabled={loading}
        />

        {error && <p className={styles.error} style={{ marginTop: '14px' }}>{error}</p>}

        <div style={{ marginTop: '24px' }}>
          <Button
            type="submit"
            loading={loading}
            fullWidth
          >
            Continuar
          </Button>
        </div>
      </form>
    </div>
  )
}
