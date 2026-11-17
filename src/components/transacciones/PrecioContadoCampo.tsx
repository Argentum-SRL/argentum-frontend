import MontoInput from '@/components/ui/MontoInput/MontoInput'
import styles from './TransaccionModal.module.css'

export interface PrecioContadoCampoProps {
  id?: string
  value: number | null
  onChange: (val: number | null) => void
  moneda?: 'ARS' | 'USD'
  labelClassName?: string
  wrapperClassName?: string
}

/**
 * Campo opcional de precio de contado para cargar o editar compras en cuotas.
 */
export default function PrecioContadoCampo({
  id = 'precio-contado-opcional',
  value,
  onChange,
  moneda = 'ARS',
  labelClassName = styles.fieldLabel,
  wrapperClassName = styles.formField,
}: PrecioContadoCampoProps) {
  return (
    <div className={wrapperClassName} data-modal-field>
      <label className={labelClassName} htmlFor={id}>
        Precio de contado (opcional)
      </label>
      <MontoInput
        id={id}
        value={value}
        onChange={onChange}
        moneda={moneda}
        placeholder="0"
        allowDecimals
      />
    </div>
  )
}
