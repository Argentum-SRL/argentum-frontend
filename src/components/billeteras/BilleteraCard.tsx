// ─── BilleteraCard ────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit2, Archive, CreditCard, DollarSign, Plus, Trash2, RotateCcw } from 'lucide-react'
import type { Billetera } from '@/types'
import { getBankById, findBankByNombre, getBankLogoUrl, formatSaldo, getInitials } from '@/lib/utils/billeteras.utils'
import styles from './BilleteraCard.module.css'

export interface BilleteraCardProps {
  billetera: Billetera
  onArchivar?: (id: string) => void
  onDesarchivar?: (id: string) => void
  onEliminar?: (id: string) => void
  onEditar?: (id: string) => void
}

const EFECTIVO_BG: Record<'ARS' | 'USD', string> = {
  ARS: 'linear-gradient(135deg, #1A3D28 0%, #0D2A1A 100%)',
  USD: 'linear-gradient(135deg, #0D2045 0%, #070f24 100%)',
}

const BilleteraCard = memo(({ 
  billetera, 
  onArchivar, 
  onDesarchivar,
  onEliminar, 
  onEditar 
}: BilleteraCardProps) => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoErr, setLogoErr] = useState(false)

  const bank = billetera.bank_id
    ? getBankById(billetera.bank_id)
    : !billetera.es_efectivo
      ? findBankByNombre(billetera.nombre)
      : undefined
  const logoUrl = bank ? getBankLogoUrl(bank.logoPath) : ''

  let background: string
  if (billetera.es_efectivo) {
    background = EFECTIVO_BG[billetera.moneda]
  } else if (bank?.gradiente) {
    background = bank.gradiente
  } else if (bank?.colorPrimario) {
    background = bank.colorPrimario
  } else {
    background = 'linear-gradient(135deg, #0D2045 0%, #061228 100%)'
  }

  const isLight = !bank || bank.colorTexto === 'white'
  const labelNombre = billetera.es_efectivo
    ? `Efectivo ${billetera.moneda}`
    : bank?.nombre ?? billetera.nombre

  const bgRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = () => setMenuOpen(false)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [menuOpen])

  // Set background variable via ref to avoid inline style lint errors
  useEffect(() => {
    if (bgRef.current) {
      bgRef.current.style.setProperty('--wc-bg', background)
    }
  }, [background])

  return (
    <div 
      className={`${styles.wc} ${menuOpen ? styles.wcMenuOpen : ''} ${billetera.estado === 'archivada' ? styles.archived : ''}`}
      onClick={() => navigate(`/app/billeteras/${billetera.id}`)}
    >
      {/* Fondo clipeado */}
      <div className={styles.wcBg} ref={bgRef}>
        <div className={styles.decoA} aria-hidden="true" />
        <div className={styles.decoB} aria-hidden="true" />
      </div>

      <div className={styles.wcInner}>
        {/* ── TOP ─────────────────────────────────────────────────────── */}
        <div className={styles.wcTop}>
          {/* Logo circular */}
          <div className={styles.wcLogo}>
            {billetera.es_efectivo ? (
              billetera.moneda === 'ARS'
                ? <CreditCard size={18} strokeWidth={1.75} color="white" />
                : <DollarSign size={18} strokeWidth={1.75} color="white" />
            ) : logoUrl && !logoErr ? (
              <img src={logoUrl} alt={bank?.nombre} onError={() => setLogoErr(true)} />
            ) : (
              <span className={styles.logoFallback}>
                {getInitials(bank?.nombre ?? billetera.nombre)}
              </span>
            )}
          </div>

          {/* Identidad */}
          <div className={styles.wcIdentity}>
            <div className={`${styles.wcName} ${isLight ? styles.textLight : styles.textDark}`}>
              {billetera.nombre}
            </div>
            <div className={styles.wcChipRow}>
              {billetera.es_principal && (
                <span className={`${styles.chip} ${isLight ? styles.chipPrincipalLight : styles.chipPrincipalDark}`}>
                  Principal
                </span>
              )}
              <span className={`${styles.chip} ${isLight ? styles.chipMonedaLight : styles.chipMonedaDark}`}>
                {billetera.moneda}
              </span>
              {billetera.es_efectivo && (
                <span className={`${styles.chip} ${isLight ? styles.chipMonedaLight : styles.chipMonedaDark}`}>
                  Efectivo
                </span>
              )}
            </div>
          </div>

          {/* Kebab — opciones de gestión */}
          <div className={styles.wcKebab}>
            <button
              className={styles.kebabBtn}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(p => !p) }}
              aria-label="Opciones"
              aria-haspopup="true"
              aria-expanded={menuOpen ? "true" : "false"}
            >
              <div className={styles.dot} />
              <div className={styles.dot} />
              <div className={styles.dot} />
            </button>

            {menuOpen && (
              <div className={styles.dropdown} role="menu">
                <button className={styles.dropdownItem} role="menuitem"
                  onClick={() => { onEditar?.(billetera.id); setMenuOpen(false) }}>
                  <Edit2 size={13} strokeWidth={1.75} /> Editar
                </button>

                {billetera.estado === 'activa' ? (
                  <>
                    {/* Reglas de Archivo / Eliminación */}
                    {billetera.es_efectivo ? (
                      <button className={styles.dropdownItem} role="menuitem"
                        onClick={() => { onArchivar?.(billetera.id); setMenuOpen(false) }}>
                        <Archive size={13} strokeWidth={1.75} /> Archivar
                      </button>
                    ) : (
                      <>
                        {billetera.tiene_transacciones ? (
                          <button className={styles.dropdownItem} role="menuitem"
                            onClick={() => { onArchivar?.(billetera.id); setMenuOpen(false) }}>
                            <Archive size={13} strokeWidth={1.75} /> Archivar
                          </button>
                        ) : (
                          <button className={`${styles.dropdownItem} ${styles.deleteItem}`} role="menuitem"
                            onClick={() => { onEliminar?.(billetera.id); setMenuOpen(false) }}>
                            <Trash2 size={13} strokeWidth={1.75} /> Eliminar
                          </button>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Estado Archivada */}
                    <button className={styles.dropdownItem} role="menuitem"
                      onClick={() => { onDesarchivar?.(billetera.id); setMenuOpen(false) }}>
                      <RotateCcw size={13} strokeWidth={1.75} /> Desarchivar
                    </button>
                    
                    {/* Solo eliminar si no es efectivo y no tiene transacciones */}
                    {!billetera.es_efectivo && !billetera.tiene_transacciones && (
                      <button className={`${styles.dropdownItem} ${styles.deleteItem}`} role="menuitem"
                        onClick={() => { onEliminar?.(billetera.id); setMenuOpen(false) }}>
                        <Trash2 size={13} strokeWidth={1.75} /> Eliminar
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── BALANCE ──────────────────────────────────────────────────── */}
        <div className={styles.wcBalance}>
          <p className={`${styles.wcBalLbl} ${isLight ? styles.balLblLight : styles.balLblDark}`}>
            {labelNombre} · Saldo actual
          </p>
          <p className={`${styles.wcBalAmt} ${isLight ? styles.balAmtLight : styles.balAmtDark}`}>
            {formatSaldo(billetera.saldo_actual, billetera.moneda)}
          </p>
        </div>
      </div>
    </div>
  )
})

BilleteraCard.displayName = 'BilleteraCard'

export default BilleteraCard

// ─── Card "Nueva billetera" — fila en mobile, columna en desktop ──────────────

export const NuevaBilleteraCard = memo(({ onClick }: { onClick: () => void }) => {
  return (
    <button className={styles.wcAdd} onClick={onClick} aria-label="Agregar nueva billetera">
      <div className={styles.addIcon}>
        <Plus size={20} strokeWidth={2} color="#8E9198" />
      </div>
      <div className={styles.addText}>
        <span className={styles.addTitle}>Nueva billetera</span>
        <span className={styles.addSub}>Agregá un banco o billetera</span>
      </div>
    </button>
  )
})

NuevaBilleteraCard.displayName = 'NuevaBilleteraCard'
