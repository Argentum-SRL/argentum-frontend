import { useState } from 'react'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { Input } from '@/components/ui/Input/Input'
import Button from '@/components/ui/Button/Button'
import styles from './DemoTamanosSelector.module.css'

/**
 * Muestra comparativa de los tres tamaños de SegmentedControl (sm, md, lg)
 * en distintos entornos reales de la aplicación para revisión antes de asignarlos.
 */
export default function DemoTamanosSelector() {
  // Estado bloque a: tres alturas en fila
  const [valA1, setValA1] = useState<'6' | '12'>('6')
  const [valA2, setValA2] = useState<'6' | '12'>('6')
  const [valA3, setValA3] = useState<'6' | '12'>('6')

  // Estado bloque b: barra de card
  const [valB, setValB] = useState<'6' | '12'>('6')

  // Estado bloque c: encabezado de página
  const [valC, setValC] = useState<'finanzas' | 'seguridad' | 'notificaciones'>('finanzas')

  // Estado bloque d: modal 520px y comparación con Input
  const [concepto, setConcepto] = useState('')
  const [valD, setValD] = useState<'egreso' | 'ingreso'>('egreso')
  const [valDCmpMd, setValDCmpMd] = useState<'contado' | 'cuotas'>('contado')
  const [valDCmpLg, setValDCmpLg] = useState<'contado' | 'cuotas'>('contado')

  // Estado bloque e: celular 375px
  const [valE2, setValE2] = useState<'egreso' | 'ingreso'>('egreso')
  const [valE3, setValE3] = useState<'entre_cuentas' | 'compra' | 'venta'>('entre_cuentas')
  const [valE4, setValE4] = useState<'todos' | 'pendientes' | 'revision' | 'aprobados'>('revision')

  // Estado bloque f: texto largo en desktop
  const [valF1Sm, setValF1Sm] = useState<'ciclo' | 'activos'>('ciclo')
  const [valF1Md, setValF1Md] = useState<'ciclo' | 'activos'>('ciclo')
  const [valF1Lg, setValF1Lg] = useState<'ciclo' | 'activos'>('ciclo')
  const [valF2Sm, setValF2Sm] = useState<'6' | '12'>('12')
  const [valF2Md, setValF2Md] = useState<'6' | '12'>('12')
  const [valF2Lg, setValF2Lg] = useState<'6' | '12'>('12')

  return (
    <section className={styles.sectionWrap} aria-label="Tamaños según el entorno (para aprobar)">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Tamaños según el entorno (para aprobar)</h3>
        <p className={styles.sectionSubtitle}>
          Muestra con el componente real ui/SegmentedControl (letra 13px, radio 10px, gap 6px).
          En pantallas táctiles (pointer: coarse), sm y md suben a 44px de alto mínimo; el marco
          celular usa lg (44px) para representar la altura táctil.
        </p>
      </div>

      <div className={styles.blocksGrid}>
        {/* a. Las tres alturas en fila */}
        <div className={styles.demoBlock}>
          <div className={styles.blockHeader}>
            <h4 className={styles.blockTitle}>a. Las tres alturas en fila</h4>
            <span className={styles.blockScreenTag}>Comparación directa: sm 36px · md 40px · lg 44px</span>
          </div>
          <div className={styles.canvas}>
            <div className={styles.heightsRow}>
              <div className={styles.heightItem}>
                <SegmentedControl
                  size="sm"
                  options={[
                    { value: '6', label: '6 meses' },
                    { value: '12', label: '12 meses' },
                  ]}
                  value={valA1}
                  onChange={setValA1}
                  ariaLabel="Tamaño sm"
                />
                <span className={styles.measurePill}>sm · 36px alto · 12px pad H · 13px</span>
              </div>

              <div className={styles.heightItem}>
                <SegmentedControl
                  size="md"
                  options={[
                    { value: '6', label: '6 meses' },
                    { value: '12', label: '12 meses' },
                  ]}
                  value={valA2}
                  onChange={setValA2}
                  ariaLabel="Tamaño md"
                />
                <span className={styles.measurePill}>md · 40px alto · 16px pad H · 13px</span>
              </div>

              <div className={styles.heightItem}>
                <SegmentedControl
                  size="lg"
                  options={[
                    { value: '6', label: '6 meses' },
                    { value: '12', label: '12 meses' },
                  ]}
                  value={valA3}
                  onChange={setValA3}
                  ariaLabel="Tamaño lg"
                />
                <span className={styles.measurePill}>lg · 44px alto · 16px pad H · 13px</span>
              </div>
            </div>
          </div>
        </div>

        {/* b. Barra de una card */}
        <div className={styles.demoBlock}>
          <div className={styles.blockHeader}>
            <h4 className={styles.blockTitle}>b. Barra de una card (size="sm")</h4>
            <span className={styles.blockScreenTag}>Pantalla real: Proyección, Evolución y Comparar de Análisis</span>
          </div>
          <div className={styles.canvas}>
            <div className={styles.cardMock}>
              <div className={styles.cardMockBar}>
                <h5 className={styles.cardMockTitle}>Proyección de cuotas</h5>
                <SegmentedControl
                  size="sm"
                  options={[
                    { value: '6', label: '6 meses' },
                    { value: '12', label: '12 meses' },
                  ]}
                  value={valB}
                  onChange={setValB}
                  ariaLabel="Horizonte de proyección"
                />
              </div>
              <div className={styles.cardMockBody}>
                Área de gráfico o tabla dentro de la card · cápsula sm: 36px alto, 12px relleno horizontal, 13px letra
              </div>
            </div>
          </div>
        </div>

        {/* c. Encabezado de página */}
        <div className={styles.demoBlock}>
          <div className={styles.blockHeader}>
            <h4 className={styles.blockTitle}>c. Encabezado de página (size="md")</h4>
            <span className={styles.blockScreenTag}>Pantalla real: Pestañas de Perfil y Herramientas</span>
          </div>
          <div className={styles.canvas}>
            <div className={styles.pageHeaderMock}>
              <h5 className={styles.pageTitleMock}>Perfil</h5>
              <SegmentedControl
                size="md"
                options={[
                  { value: 'finanzas', label: 'Finanzas & Moneda' },
                  { value: 'seguridad', label: 'Seguridad' },
                  { value: 'notificaciones', label: 'Notificaciones' },
                ]}
                value={valC}
                onChange={setValC}
                ariaLabel="Pestañas de perfil"
              />
            </div>
            <p className={styles.measureNote}>
              Medida cápsula md: 40px alto mínimo · 16px relleno horizontal · 13px letra · columnas iguales
            </p>
          </div>
        </div>

        {/* d. Formulario en un modal de 520px */}
        <div className={styles.demoBlock}>
          <div className={styles.blockHeader}>
            <h4 className={styles.blockTitle}>d. Formulario en modal de 520px (size="lg" fullWidth vs md)</h4>
            <span className={styles.blockScreenTag}>Pantalla real: Egreso/Ingreso y ¿Cómo pagaste? en TransaccionModal</span>
          </div>
          <div className={styles.canvas}>
            <div className={styles.modalFrame}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>Nueva transacción (marco 520px)</h5>
                <span className={styles.measurePill}>520px</span>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="demo-tamanos-input">
                    Descripción (Input real: 44px alto)
                  </label>
                  <Input
                    id="demo-tamanos-input"
                    placeholder="Ej: Supermercado"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Tipo (SegmentedControl lg fullWidth: 44px alto)</span>
                  <SegmentedControl
                    size="lg"
                    fullWidth
                    options={[
                      { value: 'egreso', label: 'Egreso' },
                      { value: 'ingreso', label: 'Ingreso' },
                    ]}
                    value={valD}
                    onChange={setValD}
                    ariaLabel="Tipo en modal"
                  />
                </div>

                <div className={styles.compareBar}>
                  <span className={styles.fieldLabel}>
                    Comparación de alturas lado a lado: Input (44px) vs cápsula md (40px) vs cápsula lg (44px)
                  </span>
                  <div className={styles.compareRow}>
                    <div className={styles.compareCol}>
                      <Input value="Input real (44px)" readOnly aria-label="Input de referencia 44px" />
                      <span className={styles.measureNote}>Input: 44px alto</span>
                    </div>
                    <div className={styles.compareCol}>
                      <SegmentedControl
                        size="md"
                        fullWidth
                        options={[
                          { value: 'contado', label: 'De contado' },
                          { value: 'cuotas', label: 'En cuotas' },
                        ]}
                        value={valDCmpMd}
                        onChange={setValDCmpMd}
                        ariaLabel="Comparación md"
                      />
                      <span className={styles.measureNote}>md: 40px alto</span>
                    </div>
                    <div className={styles.compareCol}>
                      <SegmentedControl
                        size="lg"
                        fullWidth
                        options={[
                          { value: 'contado', label: 'De contado' },
                          { value: 'cuotas', label: 'En cuotas' },
                        ]}
                        value={valDCmpLg}
                        onChange={setValDCmpLg}
                        ariaLabel="Comparación lg"
                      />
                      <span className={styles.measureNote}>lg: 44px alto</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" className={styles.footerCancel}>Cancelar</Button>
                <Button variant="primary" className={styles.footerPrimary}>Guardar</Button>
              </div>
            </div>
          </div>
        </div>

        {/* e. Celular de 375px de ancho */}
        <div className={styles.demoBlock}>
          <div className={styles.blockHeader}>
            <h4 className={styles.blockTitle}>e. Celular de 375px de ancho (size="lg" fullWidth)</h4>
            <span className={styles.blockScreenTag}>Pantalla real: Selectores fullWidth en móvil (2, 3 y 4 opciones)</span>
          </div>
          <div className={styles.canvas}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneHeader}>
                <span>Marco fijo 375px</span>
                <span className={styles.measurePill}>lg · 44px mín. · minmax(0, 1fr)</span>
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>2 opciones</span>
                <SegmentedControl
                  size="lg"
                  fullWidth
                  options={[
                    { value: 'egreso', label: 'Egreso' },
                    { value: 'ingreso', label: 'Ingreso' },
                  ]}
                  value={valE2}
                  onChange={setValE2}
                  ariaLabel="Celular 2 opciones"
                />
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>3 opciones</span>
                <SegmentedControl
                  size="lg"
                  fullWidth
                  options={[
                    { value: 'entre_cuentas', label: 'Entre cuentas' },
                    { value: 'compra', label: 'Comprar' },
                    { value: 'venta', label: 'Vender' },
                  ]}
                  value={valE3}
                  onChange={setValE3}
                  ariaLabel="Celular 3 opciones"
                />
              </div>

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>4 opciones (texto largo parte en dos renglones sin cortar)</span>
                <SegmentedControl
                  size="lg"
                  fullWidth
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'pendientes', label: 'Pendientes' },
                    { value: 'revision', label: 'En revisión técnica' },
                    { value: 'aprobados', label: 'Aprobados' },
                  ]}
                  value={valE4}
                  onChange={setValE4}
                  ariaLabel="Celular 4 opciones"
                />
              </div>
            </div>
          </div>
        </div>

        {/* f. Texto largo en desktop */}
        <div className={styles.demoBlock}>
          <div className={styles.blockHeader}>
            <h4 className={styles.blockTitle}>f. Texto largo en desktop (una sola línea en los tres tamaños)</h4>
            <span className={styles.blockScreenTag}>Pantalla real: ProyeccionCuotasCard en Análisis</span>
          </div>
          <div className={styles.canvas}>
            <div className={styles.desktopCompareStack}>
              <div className={styles.desktopRow}>
                <span className={styles.measurePill}>sm · 36px × 12px pad</span>
                <SegmentedControl
                  size="sm"
                  options={[
                    { value: 'ciclo', label: 'Por ciclo' },
                    { value: 'activos', label: 'Planes activos' },
                  ]}
                  value={valF1Sm}
                  onChange={setValF1Sm}
                  ariaLabel="Planes sm"
                />
                <SegmentedControl
                  size="sm"
                  options={[
                    { value: '6', label: '6 meses' },
                    { value: '12', label: '12 meses' },
                  ]}
                  value={valF2Sm}
                  onChange={setValF2Sm}
                  ariaLabel="Meses sm"
                />
              </div>

              <div className={styles.desktopRow}>
                <span className={styles.measurePill}>md · 40px × 16px pad</span>
                <SegmentedControl
                  size="md"
                  options={[
                    { value: 'ciclo', label: 'Por ciclo' },
                    { value: 'activos', label: 'Planes activos' },
                  ]}
                  value={valF1Md}
                  onChange={setValF1Md}
                  ariaLabel="Planes md"
                />
                <SegmentedControl
                  size="md"
                  options={[
                    { value: '6', label: '6 meses' },
                    { value: '12', label: '12 meses' },
                  ]}
                  value={valF2Md}
                  onChange={setValF2Md}
                  ariaLabel="Meses md"
                />
              </div>

              <div className={styles.desktopRow}>
                <span className={styles.measurePill}>lg · 44px × 16px pad</span>
                <SegmentedControl
                  size="lg"
                  options={[
                    { value: 'ciclo', label: 'Por ciclo' },
                    { value: 'activos', label: 'Planes activos' },
                  ]}
                  value={valF1Lg}
                  onChange={setValF1Lg}
                  ariaLabel="Planes lg"
                />
                <SegmentedControl
                  size="lg"
                  options={[
                    { value: '6', label: '6 meses' },
                    { value: '12', label: '12 meses' },
                  ]}
                  value={valF2Lg}
                  onChange={setValF2Lg}
                  ariaLabel="Meses lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
