export type DecisionState = 'pendiente' | 'revisada' | 'aprobada'

export interface ExtractedStyles {
  borderRadius: string | null
  padding: string | null
  fontSize: string | null
  fontWeight: string | null
  background: string | null
  color: string | null
  border: string | null
  boxShadow: string | null
  height: string | null
  transition: string | null
  gap: string | null
}

export interface DesignVariant {
  id: string
  name: string
  category: string
  componentName: string
  filePath: string
  line: number
  role: string | null
  className: string | null
  isShared: boolean
  reuseLevel: 'alto' | 'medio' | 'local'
  usageCount: number
  hasInteractiveStates: boolean
  hasDisabledState: boolean
  ariaLabel: string | null
  ariaChecked: string | null
  extractedStyles: ExtractedStyles
  hasInlineStyles: boolean
  decisionState: DecisionState
  preferredVariant: boolean
  observations: string
}

export interface ComparisonGroup {
  groupName: string
  count: number
  sharedExists: boolean
  variants: DesignVariant[]
}

export interface CriticalDivergenceFamily {
  family: string
  description: string
  examples: string[]
}

export interface DesignAuditMetrics {
  timestamp: string
  executionTimeMs: number
  scannedFiles: {
    total: number
    tsxAndTs: number
    css: number
    cssRules: number
  }
  inventorySummary: {
    totalVariantsDetected: number
    sharedComponents: number
    localImplementations: number
    divergencesAndDuplications: number
    uniqueSharedPrimitives: number
  }
  categoryDistribution: Record<string, number>
  criticalDivergenceFamilies: CriticalDivergenceFamily[]
}

export type RenderingCapabilityType =
  | 'RENDERED_IN_VIVO'
  | 'CSS_MODULE_ORIGINAL'
  | 'CANNOT_RENDER_ISOLATED'

export interface RenderingCapability {
  type: RenderingCapabilityType
  label: string
  reason?: string
  componentImport?: string
}

export interface MigrationTask {
  filesToModify: string[]
  propsToReplace: Record<string, string>
  breakingRisks: string[]
  verificationSteps: string[]
}

export interface CanonicalPattern {
  id: string
  name: string
  category: string
  componentName: string
  isShared: boolean
  primaryFile: string
  usageCount: number
  occurrencesCount: number
  extractedStyles: ExtractedStyles
  renderingCapability: RenderingCapability
  divergenceAgainstOfficial?: {
    hasDivergence: boolean
    radiusDelta?: string
    heightDelta?: string
    shadowDelta?: string
    notes?: string
  }
  migrationTask?: MigrationTask
}

export interface UnrenderableItem {
  patternId: string
  componentName: string
  filePath: string
  technicalReason: string
  isolationBlocker: string
}

export interface CoverageMatrix {
  totalFilesScanned: number
  tsxAndTsFiles: number
  cssFiles: number
  totalAstOccurrences: number
  canonicalPatternsIdentified: number
  renderedInVivoCount: number
  renderedWithOriginalCssCount: number
  unrenderableCount: number
  coveragePercentage: number
  unrenderableBreakdown: UnrenderableItem[]
  uninspectedRationale: string[]
}

export interface DesignDecision {
  categoryId: string
  preferredVariantId: string | null
  preferredVariantName: string | null
  decisionState: DecisionState
  notes: string | null
  equivalentComponents: string[]
  customTokens: Record<string, string>
  version?: number
  updatedAt?: string
  updatedBy?: string
}

export interface DesignSpecification {
  familyId: string
  familyName: string
  targetTokens: {
    borderRadius?: string
    padding?: string
    height?: string
    fontSize?: string
    fontWeight?: string
    boxShadow?: string
    border?: string
    background?: string
    activeBackground?: string
    activeColor?: string
    transition?: string
  }
  stateGuidelines: {
    hover?: string
    active?: string
    focus?: string
    disabled?: string
  }
  accessibilityRules: string[]
  status: 'borrador' | 'revisada' | 'aprobada'
  notes?: string | null
  version?: number
  updatedAt?: string
  updatedBy?: string
}

export interface DesignAuditData {
  metadata: {
    generatedAt: string
    generator: string
    framework: string
    totalCategories: number
  }
  metrics: DesignAuditMetrics
  coverageMatrix: CoverageMatrix
  categories: Record<string, DesignVariant[]>
  canonicalPatterns: Record<string, CanonicalPattern[]>
  comparisonGroups: Record<string, ComparisonGroup[]>
}

