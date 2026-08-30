import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { guardarDatosPersonales } from '@/services/onboarding.service'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './StepDatosPersonales.module.css'
import { DateInput, SelectInput, type SelectOption } from '@/components/ui'

const OPCIONES_SEXO: SelectOption[] = [
  { value: '', label: 'Seleccionar' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no_binario', label: 'No binario' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
]

interface Props {
  datosIniciales: { 
    nombre: string | null; 
    apellido: string | null;
    fecha_nacimiento?: string | null;
    sexo?: string | null;
  }
  onNext: (siguientePaso: string | null) => void
}

export default function StepDatosPersonales({ datosIniciales, onNext }: Props) {
  const { showToast } = useToast()
  const [nombre, setNombre] = useState(datosIniciales.nombre ?? '')
  const [apellido, setApellido] = useState(datosIniciales.apellido ?? '')
  const [fechaNacimiento, setFechaNacimiento] = useState(datosIniciales.fecha_nacimiento ?? '')
  const [sexo, setSexo] = useState(datosIniciales.sexo ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const nombreError = submitted && !nombre.trim() ? 'El nombre es obligatorio.' : null
  const apellidoError = submitted && !apellido.trim() ? 'El apellido es obligatorio.' : null
  
  const getFechaNacimientoError = () => {
    if (!submitted) return null
    if (!fechaNacimiento) return 'La fecha que ingresaste no es válida.'
    const parts = fechaNacimiento.split('-').map((v) => parseInt(v, 10))
    if (parts.length !== 3 || parts.some(isNaN)) return 'La fecha que ingresaste no es válida.'
    const [year, month, day] = parts
    const selectedDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (isNaN(selectedDate.getTime()) || selectedDate > today) return 'La fecha que ingresaste no es válida.'
    
    // Check 18 years
    let age = today.getFullYear() - year
    const m = (today.getMonth() + 1) - month
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--
    }
    if (age < 18) {
      return 'Tenés que ser mayor de 18 años para usar Argentum.'
    }
    return null
  }
  const fechaNacimientoError = getFechaNacimientoError()
  
  const sexoError = submitted && !sexo ? 'Seleccioná tu género' : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    
    if (!nombre.trim() || !apellido.trim() || !fechaNacimiento || !sexo) return
    if (getFechaNacimientoError() !== null) return

    setLoading(true)
    setError(null)
    try {
      const res = await guardarDatosPersonales({ 
        nombre: nombre.trim(), 
        apellido: apellido.trim(),
        fecha_nacimiento: fechaNacimiento,
        sexo: sexo
      })
      onNext(res.siguiente_paso)
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "No pudimos guardar tus datos. Intentá de nuevo.")
      setError(msg)
      showToast(msg, "error")
    } finally {
      setLoading(false)
    }
  }

  const maxBirthDate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().split('T')[0]
  })()

  const minBirthDate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 120)
    return d.toISOString().split('T')[0]
  })()

  return (
    <div>
      <h2 className={styles.title}>Contanos quién sos</h2>
      <p className={styles.subtitle}>Necesitamos tus datos para personalizar tu experiencia.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="nombre" className={styles.label}>Nombre</label>
          <input
            id="nombre"
            type="text"
            maxLength={100}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={[styles.input, nombreError ? styles.inputError : ''].filter(Boolean).join(' ')}
            placeholder="¿Cómo te llamás?"
            autoFocus
            autoComplete="given-name"
          />
          {nombreError && <p className={styles.fieldError}>{nombreError}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="apellido" className={styles.label}>Apellido</label>
          <input
            id="apellido"
            type="text"
            maxLength={100}
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className={[styles.input, apellidoError ? styles.inputError : ''].filter(Boolean).join(' ')}
            autoComplete="family-name"
          />
          {apellidoError && <p className={styles.fieldError}>{apellidoError}</p>}
        </div>

        <div className={styles.field}>
          <DateInput
            id="fecha_nacimiento"
            label="Fecha de nacimiento"
            value={fechaNacimiento}
            min={minBirthDate}
            max={maxBirthDate}
            onChange={(val) => setFechaNacimiento(val)}
            error={fechaNacimientoError || undefined}
          />
        </div>

        <div className={styles.field}>
          <SelectInput
            id="sexo"
            label="Sexo"
            value={sexo}
            onChange={setSexo}
            error={sexoError || undefined}
            options={OPCIONES_SEXO}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
