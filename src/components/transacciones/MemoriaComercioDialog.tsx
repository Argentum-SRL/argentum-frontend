import React, { useState } from 'react'
import Modal from '@/components/ui/Modal/Modal'
import { X } from '@/components/ui/icons'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import memoriaComercioService from '@/services/memoriaComercio.service'
import type { TransaccionAnteriorItem } from '@/types'
import { formatFecha, formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import { sileo } from 'sileo'
import styles from './MemoriaComercioDialog.module.css'

export interface MemoriaComercioDialogProps {
  isOpen: boolean
  onClose: () => void
  clave: string
  descripcion: string
  tipo: 'egreso' | 'ingreso'
  categoriaId: string
  subcategoriaId?: string | null
  categoriaNombre: string
  subcategoriaNombre?: string | null
  onSuccess?: () => void
}

export const MemoriaComercioDialog: React.FC<MemoriaComercioDialogProps> = ({
  isOpen,
  onClose,
  clave,
  descripcion,
  tipo,
  categoriaId,
  subcategoriaId,
  categoriaNombre,
  subcategoriaNombre,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2>(1)
  const [memoriaId, setMemoriaId] = useState<string | null>(null)
  const [anteriores, setAnteriores] = useState<TransaccionAnteriorItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const categoriaTexto = subcategoriaNombre
    ? `${categoriaNombre} > ${subcategoriaNombre}`
    : categoriaNombre

  const handleCloseSoloEstaVez = () => {
    if (isLoading) return
    onClose()
  }

  const handleGuardarSiempre = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const res = await memoriaComercioService.guardar({
        descripcion,
        tipo,
        categoria_id: categoriaId,
        subcategoria_id: subcategoriaId || null,
      })

      if (res.cantidad_anteriores === 0) {
        sileo.success({ title: 'Listo, lo voy a recordar.' })
        onClose()
      } else {
        setMemoriaId(res.memoria_id)
        setAnteriores(res.anteriores || [])
        setStep(2)
      }
    } catch (error) {
      console.error(error)
      sileo.error({ title: getErrorMessage(error, 'Error al guardar la memoria por comercio') })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDejarlosComoEstan = () => {
    if (isLoading) return
    sileo.success({ title: 'Listo, lo voy a recordar.' })
    onClose()
  }

  const handlePasarlos = async () => {
    if (isLoading || !memoriaId) return
    setIsLoading(true)
    try {
      const res = await memoriaComercioService.aplicar({
        memoria_id: memoriaId,
        transaccion_ids: anteriores.map((a) => a.id),
      })
      sileo.success({
        title: `Listo: ${res.actualizadas} movimiento(s) actualizado(s).`,
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error(error)
      sileo.error({ title: getErrorMessage(error, 'Error al aplicar la categoría a los anteriores') })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 1 ? handleCloseSoloEstaVez : handleDejarlosComoEstan}
      showHeader={false}
      size="sm"
      autoHeight
      noPadding
    >
      <div className={styles.modalRoot}>
        {step === 1 ? (
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.headerTitle}>¿Siempre así?</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleCloseSoloEstaVez}
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className={styles.formBody}>
              <p className={styles.questionText}>
                ¿Siempre que diga &quot;<strong>{clave}</strong>&quot; lo pongo en <strong>{categoriaTexto}</strong>?
              </p>

              <div className={styles.catBadge}>
                <div className={styles.catIconWrap}>
                  <SubcategoriaIcon
                    nombre={subcategoriaNombre}
                    parentCategory={categoriaNombre}
                    size={28}
                  />
                </div>
                <div className={styles.catDetails}>
                  <span className={styles.catLabel}>{subcategoriaNombre ? 'Subcategoría' : 'Categoría'}</span>
                  <span className={styles.catName}>{categoriaTexto}</span>
                </div>
              </div>
            </div>

            <div className={styles.formFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleCloseSoloEstaVez}
                disabled={isLoading}
              >
                Solo esta vez
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleGuardarSiempre}
                disabled={isLoading}
                autoFocus
              >
                {isLoading && <div className={styles.spinner} />}
                <span>Sí, siempre</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.headerTitle}>Movimientos anteriores</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleDejarlosComoEstan}
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className={styles.formBody}>
              <p className={styles.description}>
                Tenés <strong>{anteriores.length}</strong> movimiento(s) anterior(es) de &quot;<strong>{clave}</strong>&quot; en otra categoría.
              </p>

              <div className={styles.anterioresBox}>
                <div className={styles.anterioresList}>
                  {anteriores.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className={styles.anteriorItem}
                      title={`${formatFecha(item.fecha)} · ${formatMonto(item.monto, item.moneda)} · ${item.categoria_nombre}`}
                    >
                      <SubcategoriaIcon
                        nombre={item.subcategoria_nombre}
                        parentCategory={item.categoria_nombre}
                        size={16}
                      />
                      <span className={styles.anteriorDate}>{formatFecha(item.fecha)}</span>
                      <span className={styles.anteriorDot}>·</span>
                      <span className={styles.anteriorAmount}>{formatMonto(item.monto, item.moneda)}</span>
                      <span className={styles.anteriorDot}>·</span>
                      <span className={styles.anteriorCategory}>{item.categoria_nombre}</span>
                    </div>
                  ))}
                </div>
                {anteriores.length > 5 && (
                  <div className={styles.masAnteriores}>
                    y {anteriores.length - 5} más
                  </div>
                )}
              </div>

              <p className={styles.pregunta}>
                ¿Los pasamos también a <strong>{categoriaTexto}</strong>?
              </p>
            </div>

            <div className={styles.formFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleDejarlosComoEstan}
                disabled={isLoading}
              >
                Dejarlos como están
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handlePasarlos}
                disabled={isLoading}
                autoFocus
              >
                {isLoading && <div className={styles.spinner} />}
                <span>Pasarlos</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default MemoriaComercioDialog
