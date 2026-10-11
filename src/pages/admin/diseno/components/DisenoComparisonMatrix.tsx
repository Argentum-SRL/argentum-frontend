import { useState } from 'react'
import {
  Star,
  Sparkles,
  Info,
} from '@/components/ui/icons'
import { Columns2 } from 'lucide-react'
import type { DesignVariant, DesignDecision } from '@/types/diseno'
import styles from './DisenoComparisonMatrix.module.css'

interface Props {
  categoryId: string
  categoryName: string
  variants: DesignVariant[]
  decisions: Record<string, DesignDecision>
  onSaveDecision: (decision: DesignDecision) => void
}

export default function DisenoComparisonMatrix({
  categoryId,
  categoryName,
  variants,
  onSaveDecision,
}: Props) {
  // Inicializar con las dos primeras variantes o variantes clave
  const [variantAId, setVariantAId] = useState<string>(variants[0]?.id || '')
  const [variantBId, setVariantBId] = useState<string>(variants[1]?.id || variants[0]?.id || '')

  const variantA = variants.find((v) => v.id === variantAId) || variants[0]
  const variantB = variants.find((v) => v.id === variantBId) || variants[1]

  const handleSelectPreferred = (variant: DesignVariant) => {
    onSaveDecision({
      categoryId,
      preferredVariantId: variant.id,
      preferredVariantName: variant.name,
      decisionState: 'revisada',
      notes: `Elegida tras comparación lado a lado frente a ${variant.id === variantA?.id ? variantB?.name : variantA?.name}`,
      equivalentComponents: variants.filter((v) => v.id !== variant.id).map((v) => v.name),
      customTokens: Object.fromEntries(
        Object.entries(variant.extractedStyles).filter(([, v]) => v !== null) as [string, string][]
      ),
    })
  }

  if (variants.length < 2) {
    return (
      <div className={styles.emptyNotice}>
        <Info size={20} />
        <span>Se requieren al menos 2 variantes en esta categoría para la comparación lado a lado.</span>
      </div>
    )
  }

  const comparisonAttributes = [
    { label: 'Componente / Tag', prop: 'componentName' as const },
    { label: 'Ubicación en Código', prop: 'filePath' as const },
    { label: 'Nivel de Reutilización', prop: 'reuseLevel' as const },
    { label: 'Border Radius', styleKey: 'borderRadius' as const },
    { label: 'Altura (Height)', styleKey: 'height' as const },
    { label: 'Relleno (Padding)', styleKey: 'padding' as const },
    { label: 'Tipografía (Font Size)', styleKey: 'fontSize' as const },
    { label: 'Sombra / Elevación', styleKey: 'boxShadow' as const },
    { label: 'Separación (Gap)', styleKey: 'gap' as const },
    { label: 'Fondo (Background)', styleKey: 'background' as const },
  ]

  return (
    <div className={styles.matrixContainer}>
      <div className={styles.matrixHeader}>
        <div className={styles.headerTitleGroup}>
          <Columns2 size={20} />
          <h2 className={styles.matrixTitle}>Comparador Lado a Lado: {categoryName}</h2>
        </div>
        <p className={styles.matrixSubtitle}>
          Contraste directo de tokens CSS, anatomía física y especificidad entre implementaciones divergentes.
        </p>
      </div>

      {/* Selectores de Variantes a Comparar */}
      <div className={styles.selectorsRow}>
        <div className={styles.selectorCol}>
          <label className={styles.selectorLabel}>Variante de Referencia (A):</label>
          <select
            className={styles.selectInput}
            value={variantAId}
            onChange={(e) => setVariantAId(e.target.value)}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.isShared ? '⭐ (Oficial) ' : ''}{v.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectorCol}>
          <label className={styles.selectorLabel}>Variante a Contrastar (B):</label>
          <select
            className={styles.selectInput}
            value={variantBId}
            onChange={(e) => setVariantBId(e.target.value)}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.isShared ? '⭐ (Oficial) ' : ''}{v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tablas Comparativas Lado a Lado */}
      <div className={styles.comparisonGrid}>
        {/* Columna A */}
        <div className={styles.compareCard}>
          <div className={styles.compareCardHeader}>
            <div>
              <span className={styles.colBadge}>Variante A</span>
              <h3 className={styles.compareCardName}>{variantA?.name}</h3>
              <span className={styles.compareCardPath}><code>{variantA?.filePath}#L{variantA?.line}</code></span>
            </div>
            <button
              type="button"
              className={styles.markPreferredBtn}
              onClick={() => variantA && handleSelectPreferred(variantA)}
            >
              <Star size={14} />
              <span>Aprobar como Estándar</span>
            </button>
          </div>

          <div className={styles.attrList}>
            {comparisonAttributes.map((attr, idx) => {
              const val = attr.styleKey
                ? variantA?.extractedStyles[attr.styleKey] || 'Heredado / No explícito'
                : String(variantA?.[attr.prop as keyof DesignVariant] || '-')

              return (
                <div key={idx} className={styles.attrRow}>
                  <span className={styles.attrLabel}>{attr.label}</span>
                  <span className={styles.attrValue}>{val}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Columna B */}
        <div className={styles.compareCard}>
          <div className={styles.compareCardHeader}>
            <div>
              <span className={styles.colBadge}>Variante B</span>
              <h3 className={styles.compareCardName}>{variantB?.name}</h3>
              <span className={styles.compareCardPath}><code>{variantB?.filePath}#L{variantB?.line}</code></span>
            </div>
            <button
              type="button"
              className={styles.markPreferredBtn}
              onClick={() => variantB && handleSelectPreferred(variantB)}
            >
              <Star size={14} />
              <span>Aprobar como Estándar</span>
            </button>
          </div>

          <div className={styles.attrList}>
            {comparisonAttributes.map((attr, idx) => {
              const val = attr.styleKey
                ? variantB?.extractedStyles[attr.styleKey] || 'Heredado / No explícito'
                : String(variantB?.[attr.prop as keyof DesignVariant] || '-')

              return (
                <div key={idx} className={styles.attrRow}>
                  <span className={styles.attrLabel}>{attr.label}</span>
                  <span className={styles.attrValue}>{val}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Diagnóstico de Divergencia Automático */}
      <div className={styles.diagnosisBox}>
        <div className={styles.diagnosisHeader}>
          <Sparkles size={16} />
          <span>Diagnóstico de Unificación Recomendado</span>
        </div>
        <p className={styles.diagnosisText}>
          {variantA?.extractedStyles.borderRadius !== variantB?.extractedStyles.borderRadius ? (
            <>Divergencia de curvatura detectada: <strong>{variantA?.extractedStyles.borderRadius || 'def'}</strong> vs <strong>{variantB?.extractedStyles.borderRadius || 'def'}</strong>. Se recomienda converger al radio del design system oficial de Argentum (12px para controles medianos, 14px para modales). </>
          ) : (
            <>Ambas variantes comparten el mismo radio de borde. Las diferencias radican principalmente en padding y elevación. </>
          )}
          La unificación permitirá sustituir la implementación local sin alterar la funcionalidad.
        </p>
      </div>
    </div>
  )
}
