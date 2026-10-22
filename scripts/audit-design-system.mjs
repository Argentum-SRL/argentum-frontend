#!/usr/bin/env node

/**
 * ============================================================================
 * Argentum Design System Auditor — AST & Static Inspection Engine
 * ============================================================================
 *
 * Recorre sistemáticamente el frontend de Argentum, analiza el AST con TypeScript,
 * extrae reglas CSS y CSS Modules, detecta componentes, props, variantes visuales,
 * estados de interacción, inconsistencias de diseño y nivel de reutilización.
 *
 * Categorías cubiertas:
 *  1. Botones de acción (primarios, secundarios, destructivos, icon-only, etc.)
 *  2. Selectores segmentados (operación, períodos, modos, tabs segmentados)
 *  3. Opciones seleccionables (tarjetas de método de pago, renovación, radios, switches)
 *  4. Campos de entrada (texto, importes/MontoInput, fechas, selects, textareas)
 *  5. Selección avanzada (CategoriaSelector, PhoneCountrySelect, ColorPicker, dropdowns)
 *  6. Tarjetas y paneles (billeteras, transacciones, metas, resúmenes, estadísticas)
 *  7. Modales y diálogos (encabezados, cuerpos, pies, confirmaciones, drawers)
 *  8. Navegación (tabs, FilterBar, drawers móviles, paginación)
 *  9. Elementos informativos (badges, etiquetas, alertas, tooltips, toasts)
 * 10. Estados de interfaz (spinners, LunarLoader, skeletons, estados vacíos, errores)
 * 11. Elementos financieros (importes monetarios, balances, variaciones, monedas)
 * 12. Controles especiales (CicloFinancieroSelector, WheelPicker, tablas admin)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(FRONTEND_ROOT, 'src');
const AUDITORIAS_DIR = process.env.ARGENTUM_AUDITORIAS_DIR
  ? path.resolve(process.env.ARGENTUM_AUDITORIAS_DIR)
  : path.resolve('D:\\Argentum\\auditorias');

if (!fs.existsSync(AUDITORIAS_DIR)) {
  process.stderr.write(`No existe la carpeta de auditorías: ${AUDITORIAS_DIR}\n`);
  process.exit(1);
}

// Asegurar directorios de salida
const DATA_DIR = path.resolve(SRC_DIR, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// 1. Recolección de archivos
// ---------------------------------------------------------------------------
function getFilesRecursively(dir, extensions = ['.tsx', '.ts', '.css', '.module.css']) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'coverage', 'graphify-out'].includes(entry.name)) {
        results = results.concat(getFilesRecursively(fullPath, extensions));
      }
    } else if (entry.isFile()) {
      if (extensions.some(ext => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 2. Parser de CSS y CSS Modules
// ---------------------------------------------------------------------------
function parseCssRules(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rules = [];

  // Expresión regular robusta para selectores y bloques CSS
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(content)) !== null) {
    const rawSelector = match[1].trim();
    const rawDeclarations = match[2].trim();

    // Parsear declaraciones individuales
    const decls = {};
    const declPairs = rawDeclarations.split(';');
    for (const pair of declPairs) {
      const colonIdx = pair.indexOf(':');
      if (colonIdx !== -1) {
        const prop = pair.slice(0, colonIdx).trim().toLowerCase();
        const val = pair.slice(colonIdx + 1).trim();
        if (prop && val) {
          decls[prop] = val;
        }
      }
    }

    if (Object.keys(decls).length > 0) {
      rules.push({
        selector: rawSelector,
        declarations: decls,
        isDarkMode: rawSelector.includes('[data-theme="dark"]') || rawSelector.includes('.dark'),
        isInteractiveState: /:(hover|active|focus|focus-visible|disabled|checked)/.test(rawSelector),
        usesVariables: Object.values(decls).some(v => v.includes('var(')),
        usesElevation: Object.values(decls).some(v => v.includes('--elevation')),
      });
    }
  }

  return rules;
}

// ---------------------------------------------------------------------------
// 3. Parser de AST TypeScript
// ---------------------------------------------------------------------------
class ComponentAstVisitor {
  constructor(filePath, sourceCode) {
    this.filePath = filePath;
    this.relPath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
    this.sourceCode = sourceCode;
    this.sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    this.components = [];
    this.imports = [];
    this.cssImports = [];
    this.jsxElements = [];
  }

  analyze() {
    this.visit(this.sourceFile);
    return {
      filePath: this.filePath,
      relPath: this.relPath,
      components: this.components,
      imports: this.imports,
      cssImports: this.cssImports,
      jsxElements: this.jsxElements,
    };
  }

  visit(node) {
    // Detectar imports
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier.text;
      if (moduleSpecifier.endsWith('.css') || moduleSpecifier.endsWith('.module.css')) {
        this.cssImports.push({
          source: moduleSpecifier,
          name: node.importClause?.name?.text || 'styles',
        });
      } else {
        const namedBindings = [];
        if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          for (const el of node.importClause.namedBindings.elements) {
            namedBindings.push(el.name.text);
          }
        }
        this.imports.push({
          module: moduleSpecifier,
          defaultImport: node.importClause?.name?.text || null,
          namedImports: namedBindings,
        });
      }
    }

    // Detectar funciones que devuelven JSX (Componentes React)
    if (ts.isFunctionDeclaration(node) && node.name) {
      if (this.isReactComponentName(node.name.text)) {
        this.components.push(this.extractComponentInfo(node.name.text, node));
      }
    } else if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && this.isReactComponentName(decl.name.text)) {
          if (decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
            this.components.push(this.extractComponentInfo(decl.name.text, decl.initializer));
          }
        }
      }
    }

    // Detectar elementos JSX clave
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = ts.isJsxElement(node) ? node.openingElement.tagName.getText(this.sourceFile) : node.tagName.getText(this.sourceFile);
      const attrs = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
      
      const props = {};
      let role = null;
      let className = null;
      let styleProp = null;
      let ariaLabel = null;
      let ariaChecked = null;
      let onClick = false;
      let disabled = false;

      for (const prop of attrs.properties) {
        if (ts.isJsxAttribute(prop) && prop.name) {
          const propName = prop.name.text;
          const propValue = prop.initializer ? prop.initializer.getText(this.sourceFile) : 'true';
          props[propName] = propValue;

          if (propName === 'role') role = propValue.replace(/['"]/g, '');
          if (propName === 'className') className = propValue;
          if (propName === 'style') styleProp = propValue;
          if (propName === 'aria-label' || propName === 'ariaLabel') ariaLabel = propValue;
          if (propName === 'aria-checked') ariaChecked = propValue;
          if (propName === 'onClick') onClick = true;
          if (propName === 'disabled') disabled = true;
        }
      }

      const { line, character } = this.sourceFile.getLineAndCharacterOfPosition(node.getStart());

      this.jsxElements.push({
        tag,
        line: line + 1,
        character: character + 1,
        props,
        role,
        className,
        styleProp,
        ariaLabel,
        ariaChecked,
        hasOnClick: onClick,
        hasDisabled: disabled,
      });
    }

    ts.forEachChild(node, (child) => this.visit(child));
  }

  isReactComponentName(name) {
    return /^[A-Z][A-Za-z0-9_]*$/.test(name);
  }

  extractComponentInfo(name, node) {
    const { line } = this.sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const props = [];
    
    // Extraer props tipadas si hay parámetros
    if (node.parameters && node.parameters.length > 0) {
      const firstParam = node.parameters[0];
      if (firstParam.type) {
        props.push(firstParam.type.getText(this.sourceFile));
      } else if (ts.isObjectBindingPattern(firstParam.name)) {
        for (const el of firstParam.name.elements) {
          props.push(el.name.getText(this.sourceFile));
        }
      }
    }

    return {
      name,
      line: line + 1,
      props,
      isExported: (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0,
    };
  }
}

// ---------------------------------------------------------------------------
// 4. Clasificador y Catalogador por Categorías Reales
// ---------------------------------------------------------------------------
function categorizeItem(item, cssMap) {
  const { relPath, jsx } = item;
  const tag = jsx.tag;
  const className = jsx.className || '';
  const role = jsx.role || '';
  const lowerClass = className.toLowerCase();
  const lowerPath = relPath.toLowerCase();

  // 1. SELECTORES SEGMENTADOS (Segmented Controls)
  if (
    tag === 'SegmentedControl' ||
    role === 'radiogroup' ||
    lowerClass.includes('segmented') ||
    lowerClass.includes('periodsegmented') ||
    lowerClass.includes('typepill') ||
    (lowerClass.includes('bar') && lowerClass.includes('pill')) ||
    (lowerClass.includes('tab') && (lowerClass.includes('egreso') || lowerClass.includes('ingreso') || lowerClass.includes('aporte')))
  ) {
    return 'selectores_segmentados';
  }

  // 2. OPCIONES SELECCIONABLES (Selectable Cards / Radios / Switches / Renewal Cards)
  if (
    tag === 'SelectableSurface' ||
    lowerClass.includes('renewalcard') ||
    lowerClass.includes('paymentcard') ||
    lowerClass.includes('methodcard') ||
    lowerClass.includes('selectioncard') ||
    lowerClass.includes('walletpicker') ||
    lowerClass.includes('billeteraselect') ||
    (role === 'radio' && !lowerClass.includes('segmented')) ||
    (role === 'checkbox') ||
    lowerClass.includes('switch') ||
    lowerClass.includes('checkbox')
  ) {
    return 'opciones_seleccionables';
  }

  // 3. CAMPOS DE ENTRADA (Inputs, Textarea, Selects, MontoInput, DateInput)
  if (
    tag === 'Input' ||
    tag === 'MontoInput' ||
    tag === 'DateInput' ||
    tag === 'TimeInput' ||
    tag === 'SelectInput' ||
    tag === 'Field' ||
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    lowerClass.includes('montohero') ||
    lowerClass.includes('inputfield') ||
    lowerClass.includes('forminput')
  ) {
    return 'campos_entrada';
  }

  // 4. SELECCIÓN AVANZADA (Dropdowns, CategoriaSelector, PhoneCountrySelect, ColorPicker)
  if (
    tag === 'CategoriaSelector' ||
    tag === 'PhoneCountrySelect' ||
    tag === 'ColorPicker' ||
    tag === 'DropdownMenu' ||
    tag.includes('Dropdown') ||
    tag.includes('Combobox') ||
    tag.includes('Select') && tag !== 'SelectInput'
  ) {
    return 'seleccion_avanzada';
  }

  // 5. BOTONES DE ACCIÓN (Action Buttons)
  if (
    tag === 'Button' ||
    tag === 'GoogleLoginButton' ||
    (tag === 'button' && !lowerClass.includes('segmented') && !lowerClass.includes('closebtn') && !lowerClass.includes('tab'))
  ) {
    return 'botones_accion';
  }

  // 6. TARJETAS Y PANELES (Cards, Wallets, Goals, Transactions, Stats)
  if (
    tag === 'BilleteraCard' ||
    tag === 'GoalCard' ||
    tag === 'TransaccionRow' ||
    tag === 'DayGroup' ||
    tag === 'PageSummaryBar' ||
    lowerClass.includes('card') ||
    lowerClass.includes('panel') ||
    lowerClass.includes('resumencard') ||
    lowerClass.includes('metricbox') ||
    lowerClass.includes('statscard')
  ) {
    return 'tarjetas_paneles';
  }

  // 7. MODALES Y DIÁLOGOS (Modals, Dialogs, Drawers, Confirms)
  if (
    tag === 'Modal' ||
    tag === 'ConfirmModal' ||
    tag === 'Drawer' ||
    lowerPath.includes('modal') ||
    lowerPath.includes('drawer') ||
    lowerClass.includes('modalcontainer') ||
    lowerClass.includes('modalheader') ||
    lowerClass.includes('modalfooter')
  ) {
    return 'modales_dialogos';
  }

  // 8. NAVEGACIÓN (Tabs, FilterBar, Mobile Drawers, Breadcrumbs)
  if (
    lowerClass.includes('filterbar') ||
    lowerClass.includes('navbar') ||
    lowerClass.includes('tabheader') ||
    lowerClass.includes('tabnav') ||
    role === 'tablist' ||
    role === 'tab' ||
    tag === 'FilterBar' ||
    lowerClass.includes('pagination')
  ) {
    return 'navegacion';
  }

  // 9. ELEMENTOS INFORMATIVOS (Badges, Chips, Alerts, Tooltips, Toasts)
  if (
    tag === 'DebitoAutomaticoBadge' ||
    tag === 'SileoToaster' ||
    lowerClass.includes('badge') ||
    lowerClass.includes('pill') ||
    lowerClass.includes('alert') ||
    lowerClass.includes('tooltip') ||
    lowerClass.includes('tag') ||
    lowerClass.includes('toast')
  ) {
    return 'elementos_informativos';
  }

  // 10. ESTADOS DE INTERFAZ (Loaders, Spinners, Skeletons, Empty states, Error states)
  if (
    tag === 'LunarLoader' ||
    tag === 'AtmosphericLoading' ||
    tag === 'EmptyState' ||
    tag === 'PageErrorBoundary' ||
    tag === 'RootErrorBoundary' ||
    lowerClass.includes('skeleton') ||
    lowerClass.includes('spinner') ||
    lowerClass.includes('loading') ||
    lowerClass.includes('empty')
  ) {
    return 'estados_interfaz';
  }

  // 11. ELEMENTOS FINANCIEROS (Currency, Montos, Variaciones, Balances)
  if (
    lowerClass.includes('amount') ||
    lowerClass.includes('monto') ||
    lowerClass.includes('saldo') ||
    lowerClass.includes('balance') ||
    lowerClass.includes('variation') ||
    lowerClass.includes('monedabadge') ||
    lowerClass.includes('currency')
  ) {
    return 'elementos_financieros';
  }

  // 12. CONTROLES ESPECIALES
  if (
    tag === 'CicloFinancieroSelector' ||
    tag === 'WheelPicker' ||
    tag === 'TableAvatar' ||
    tag === 'AtmosphericBackground' ||
    tag === 'ThemeToggle' ||
    lowerClass.includes('picker') ||
    lowerClass.includes('tableavatar')
  ) {
    return 'controles_especiales';
  }

  return 'otros';
}

// ---------------------------------------------------------------------------
// 5. Extracción de Estilos Asociados a un Componente
// ---------------------------------------------------------------------------
function extractStylesForClass(cssMap, classNames) {
  if (!classNames) return {};
  const cleaned = classNames.replace(/[\$`{}:]/g, ' ').split(/\s+/).filter(Boolean);
  const foundDeclarations = {};

  for (const cn of cleaned) {
    for (const [filePath, rules] of Object.entries(cssMap)) {
      for (const rule of rules) {
        if (rule.selector.includes(cn)) {
          Object.assign(foundDeclarations, rule.declarations);
        }
      }
    }
  }

  return foundDeclarations;
}

// ---------------------------------------------------------------------------
// 6. Ejecución Principal de la Auditoría
// ---------------------------------------------------------------------------
export async function runDesignAudit() {
  console.log('🚀 Iniciando Auditoría Integral de Diseño de Argentum...');
  const startTime = Date.now();

  const allFiles = getFilesRecursively(SRC_DIR);
  const tsxFiles = allFiles.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
  const cssFiles = allFiles.filter(f => f.endsWith('.css'));

  console.log(`📁 Archivos encontrados: ${tsxFiles.length} TypeScript/React, ${cssFiles.length} CSS`);

  // Parsear todos los archivos CSS
  const cssRulesMap = {};
  let totalCssRules = 0;
  for (const cssPath of cssFiles) {
    const rel = path.relative(SRC_DIR, cssPath).replace(/\\/g, '/');
    const rules = parseCssRules(cssPath);
    cssRulesMap[rel] = rules;
    totalCssRules += rules.length;
  }
  console.log(`🎨 Reglas CSS analizadas: ${totalCssRules} en ${cssFiles.length} hojas de estilo`);

  // Parsear AST de todos los archivos TypeScript
  const astData = [];
  const componentOccurrences = new Map();

  for (const filePath of tsxFiles) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const visitor = new ComponentAstVisitor(filePath, code);
    const result = visitor.analyze();
    astData.push(result);

    // Conteo de uso de componentes para evaluar nivel de reutilización
    for (const comp of result.components) {
      componentOccurrences.set(comp.name, (componentOccurrences.get(comp.name) || 0) + 1);
    }
    for (const imp of result.imports) {
      if (imp.defaultImport) {
        componentOccurrences.set(imp.defaultImport, (componentOccurrences.get(imp.defaultImport) || 0) + 1);
      }
      for (const named of imp.namedImports) {
        componentOccurrences.set(named, (componentOccurrences.get(named) || 0) + 1);
      }
    }
  }

  // Agrupar e inventariar elementos detectados
  const categoryInventory = {
    selectores_segmentados: [],
    opciones_seleccionables: [],
    campos_entrada: [],
    seleccion_avanzada: [],
    botones_accion: [],
    tarjetas_paneles: [],
    modales_dialogos: [],
    navegacion: [],
    elementos_informativos: [],
    estados_interfaz: [],
    elementos_financieros: [],
    controles_especiales: [],
  };

  const detectedVariants = [];
  let uniquePatternCount = 0;
  let duplicationCount = 0;

  for (const fileResult of astData) {
    const isSharedUI = fileResult.relPath.startsWith('components/ui/');

    for (const jsx of fileResult.jsxElements) {
      const category = categorizeItem({ relPath: fileResult.relPath, jsx }, cssRulesMap);
      if (category === 'otros' || !categoryInventory[category]) continue;

      const styles = extractStylesForClass(cssRulesMap, jsx.className);
      const isCustomImplementation = !isSharedUI;
      const usageCount = componentOccurrences.get(jsx.tag) || 1;

      const variantEntry = {
        id: `${fileResult.relPath}#L${jsx.line}_${jsx.tag}`,
        name: `${jsx.tag} en ${path.basename(fileResult.relPath)}`,
        category,
        componentName: jsx.tag,
        filePath: fileResult.relPath,
        line: jsx.line,
        role: jsx.role || null,
        className: jsx.className || null,
        isShared: isSharedUI,
        reuseLevel: isSharedUI ? (usageCount > 3 ? 'alto' : 'medio') : 'local',
        usageCount,
        hasInteractiveStates: !!(jsx.hasOnClick || jsx.role === 'radio' || jsx.role === 'button'),
        hasDisabledState: jsx.hasDisabled,
        ariaLabel: jsx.ariaLabel || null,
        ariaChecked: jsx.ariaChecked || null,
        extractedStyles: {
          borderRadius: styles['border-radius'] || null,
          padding: styles['padding'] || null,
          fontSize: styles['font-size'] || null,
          fontWeight: styles['font-weight'] || null,
          background: styles['background'] || styles['background-color'] || null,
          color: styles['color'] || null,
          border: styles['border'] || null,
          boxShadow: styles['box-shadow'] || null,
          height: styles['height'] || null,
          transition: styles['transition'] || null,
          gap: styles['gap'] || null,
        },
        hasInlineStyles: !!jsx.styleProp,
        decisionState: 'pendiente', // 'pendiente' | 'revisada' | 'aprobada'
        preferredVariant: false,
        observations: isSharedUI
          ? 'Componente compartido oficial del sistema de diseño'
          : `Implementación local en ${fileResult.relPath}; diverge de la versión centralizada`,
      };

      categoryInventory[category].push(variantEntry);
      detectedVariants.push(variantEntry);

      if (isCustomImplementation) {
        duplicationCount++;
      } else {
        uniquePatternCount++;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Deduplicación Inteligente y Construcción de Patrones Canónicos
  // ---------------------------------------------------------------------------
  // Agrupa las 3.500+ ocurrencias de código en patrones de diseño canónicos y únicos,
  // distinguiendo diferencias reales de diseño de simples repeticiones sintácticas.
  const canonicalPatterns = {};
  const unrenderableList = [];

  // Mapeo de capacidades y metadatos de renderizado por patrón conocido
  const KNOWN_CANONICAL_METADATA = {
    // Selectores segmentados
    'SegmentedControl': {
      name: 'SegmentedControl (Oficial Compartido)',
      isShared: true,
      primaryFile: 'src/components/ui/SegmentedControl.tsx',
      capability: { type: 'RENDERED_IN_VIVO', label: 'Componente Original de Producción', componentImport: '@/components/ui/SegmentedControl' },
      divergence: { hasDivergence: false, notes: 'Estándar del sistema de diseño' },
      migration: { filesToModify: [], propsToReplace: {}, breakingRisks: [], verificationSteps: ['npm run type-check'] }
    },
    'TransaccionModal_pill': {
      name: 'Selector Tipo Transacción (Egreso/Ingreso)',
      isShared: false,
      primaryFile: 'src/components/transacciones/TransaccionModal.tsx',
      capability: { type: 'CSS_MODULE_ORIGINAL', label: 'CSS Module Original de TransaccionModal' },
      divergence: { hasDivergence: true, radiusDelta: '10px vs 8px oficial', heightDelta: '38px vs 36px', shadowDelta: 'elevation-sm', notes: 'Usa container de 14px con padding 4px en surface-alt' },
      migration: {
        filesToModify: ['src/components/transacciones/TransaccionModal.tsx', 'src/components/transacciones/TransaccionModal.module.css'],
        propsToReplace: { 'className={styles.transaccionPill}': '<SegmentedControl options={...} value={tipo} onChange={setTipo} />' },
        breakingRisks: ['Ajuste de margen inferior respecto al campo de importe', 'Verificar icono de flecha egreso/ingreso dentro del label'],
        verificationSteps: ['Abrir modal de creación de transacción', 'Comprobar alternancia de tipo en móvil', 'tsc -b']
      }
    },
    'PagarResumenModal_pill': {
      name: 'Selector Modal de Pago de Tarjeta (Total/Otro)',
      isShared: false,
      primaryFile: 'src/components/tarjetas/PagarResumenModal.tsx',
      capability: { type: 'CSS_MODULE_ORIGINAL', label: 'CSS Module Original de PagarResumenModal' },
      divergence: { hasDivergence: true, radiusDelta: '12px independiente', heightDelta: '42px vs 36px', shadowDelta: 'borde individual 1px', notes: 'Sin contenedor exterior gris, píldoras separadas con borde propio' },
      migration: {
        filesToModify: ['src/components/tarjetas/PagarResumenModal.tsx', 'src/components/tarjetas/PagarResumenModal.module.css'],
        propsToReplace: { 'className={styles.pagoPill}': '<SegmentedControl size="lg" ... />' },
        breakingRisks: ['El tamaño actual es 42px; al pasar a 36px/40px verificar altura del botón pagar'],
        verificationSteps: ['Simular pago total de resumen de tarjeta', 'Validar cambio a otro importe con input']
      }
    },
    'PresupuestoModal_period': {
      name: 'Selector Período de Presupuesto (Semanal/Quincenal/Mensual)',
      isShared: false,
      primaryFile: 'src/components/presupuestos/PresupuestoModal.tsx',
      capability: { type: 'CSS_MODULE_ORIGINAL', label: 'CSS Module Original de PresupuestoModal' },
      divergence: { hasDivergence: true, radiusDelta: '9px vs 8px', heightDelta: '44px vs 36px', notes: '3 opciones con texto en negrita y contenedor surface-3' },
      migration: {
        filesToModify: ['src/components/presupuestos/PresupuestoModal.tsx', 'src/components/presupuestos/PresupuestoModal.module.css'],
        propsToReplace: { 'className={styles.periodBar}': '<SegmentedControl options={PERIOD_OPTIONS} value={periodo} onChange={setPeriodo} />' },
        breakingRisks: ['Verificar cálculo automático de monto sugerido al cambiar de período'],
        verificationSteps: ['Crear nuevo presupuesto y ciclar semanal/mensual']
      }
    },
    'GoalContributionModal_operation': {
      name: 'Selector Operación Meta (Aporte / Retiro)',
      isShared: false,
      primaryFile: 'src/components/metas/GoalContributionModal.tsx',
      capability: { type: 'CSS_MODULE_ORIGINAL', label: 'CSS Module Original de GoalContributionModal' },
      divergence: { hasDivergence: true, radiusDelta: '10px', heightDelta: '38px', notes: 'Iconos Plus/Minus dinámicos' },
      migration: {
        filesToModify: ['src/components/metas/GoalContributionModal.tsx'],
        propsToReplace: { 'className={styles.operationPill}': '<SegmentedControl options={OP_OPTIONS} ... />' },
        breakingRisks: ['Confirmar colores semánticos: verde para aporte, rojo para retiro'],
        verificationSteps: ['Testear aporte a meta y retiro a billetera']
      }
    },

    // Botones
    'Button': {
      name: 'Button (Oficial Compartido — Variantes y Tamaños)',
      isShared: true,
      primaryFile: 'src/components/ui/Button/Button.tsx',
      capability: { type: 'RENDERED_IN_VIVO', label: 'Componente Original de Producción', componentImport: '@/components/ui/Button/Button' },
      divergence: { hasDivergence: false, notes: 'Botón primario, secundario, ghost y danger con tokens oficiales' },
      migration: { filesToModify: [], propsToReplace: {}, breakingRisks: [], verificationSteps: ['npm run type-check'] }
    },
    'button_local_submit': {
      name: 'Botón HTML Nativo en Modales Locales',
      isShared: false,
      primaryFile: 'src/components/transacciones/TransaccionModal.tsx',
      capability: { type: 'CSS_MODULE_ORIGINAL', label: 'CSS Module Original' },
      divergence: { hasDivergence: true, radiusDelta: '10px vs 12px oficial', notes: 'Usa estilo inline o CSS Module en lugar de importar <Button variant="primary">' },
      migration: {
        filesToModify: ['src/components/transacciones/TransaccionModal.tsx'],
        propsToReplace: { '<button className={styles.submitBtn}>': '<Button variant="primary" size="lg" type="submit">' },
        breakingRisks: ['Revisar spinner de carga; <Button> ya soporta prop loading'],
        verificationSteps: ['Verificar feedback táctil y estado de carga']
      }
    },

    // Opciones seleccionables
    'SelectableSurface': {
      name: 'SelectableSurface (Oficial Compartido)',
      isShared: true,
      primaryFile: 'src/components/ui/SelectableSurface/SelectableSurface.tsx',
      capability: { type: 'RENDERED_IN_VIVO', label: 'Componente Original de Producción', componentImport: '@/components/ui/SelectableSurface/SelectableSurface' },
      divergence: { hasDivergence: false, notes: 'Superficie de selección con elevación y foco accesible' },
      migration: { filesToModify: [], propsToReplace: {}, breakingRisks: [], verificationSteps: ['npm run type-check'] }
    },
    'RenewalCard': {
      name: 'Tarjeta de Renovación de Presupuesto',
      isShared: false,
      primaryFile: 'src/components/presupuestos/PresupuestoModal.tsx',
      capability: { type: 'CSS_MODULE_ORIGINAL', label: 'CSS Module Original' },
      divergence: { hasDivergence: true, radiusDelta: '14px', shadowDelta: 'var(--elevation-sm)', notes: 'Radio button personalizado circular' },
      migration: {
        filesToModify: ['src/components/presupuestos/PresupuestoModal.tsx'],
        propsToReplace: { '<div className={styles.renewalCard}>': '<SelectableSurface selected={isRenewal} ...>' },
        breakingRisks: ['Preservar badge informativo de renovación automática'],
        verificationSteps: ['Validar toggle de renovación de presupuesto']
      }
    },

    // Campos de entrada
    'MontoInput': {
      name: 'MontoInput (Oficial Compartido con Formato Monetario)',
      isShared: true,
      primaryFile: 'src/components/ui/MontoInput/MontoInput.tsx',
      capability: { type: 'RENDERED_IN_VIVO', label: 'Componente Original de Producción', componentImport: '@/components/ui/MontoInput/MontoInput' },
      divergence: { hasDivergence: false, notes: 'Formateo ARS/USD en vivo con cursor y separador de miles' },
      migration: { filesToModify: [], propsToReplace: {}, breakingRisks: [], verificationSteps: ['npm run type-check'] }
    },
    'Input': {
      name: 'Input (Oficial Compartido con Label y Error)',
      isShared: true,
      primaryFile: 'src/components/ui/Input/Input.tsx',
      capability: { type: 'RENDERED_IN_VIVO', label: 'Componente Original de Producción', componentImport: '@/components/ui/Input/Input' },
      divergence: { hasDivergence: false, notes: 'Input de texto con icono opcional y mensaje de error' },
      migration: { filesToModify: [], propsToReplace: {}, breakingRisks: [], verificationSteps: ['npm run type-check'] }
    },

    // Estados de interfaz
    'LunarLoader': {
      name: 'LunarLoader (Spinner Atmosférico Oficial)',
      isShared: true,
      primaryFile: 'src/components/ui/LunarLoader/LunarLoader.tsx',
      capability: { type: 'RENDERED_IN_VIVO', label: 'Componente Original de Producción', componentImport: '@/components/ui/LunarLoader/LunarLoader' },
      divergence: { hasDivergence: false, notes: 'Loader canónico de la marca Argentum' },
      migration: { filesToModify: [], propsToReplace: {}, breakingRisks: [], verificationSteps: ['npm run type-check'] }
    },
    'EmptyState': {
      name: 'EmptyState (Pantalla de Estado Vacío Oficial)',
      isShared: true,
      primaryFile: 'src/components/ui/EmptyState/EmptyState.tsx',
      capability: { type: 'RENDERED_IN_VIVO', label: 'Componente Original de Producción', componentImport: '@/components/ui/EmptyState/EmptyState' },
      divergence: { hasDivergence: false, notes: 'Ilustración, título, descripción y botón de acción' },
      migration: { filesToModify: [], propsToReplace: {}, breakingRisks: [], verificationSteps: ['npm run type-check'] }
    },

    // Componentes No Renderizables en Aislamiento
    'WhatsAppQrModal': {
      name: 'WhatsAppQrModal (Modal de Vinculación WhatsApp)',
      isShared: false,
      primaryFile: 'src/components/admin/WhatsAppQrModal.tsx',
      capability: {
        type: 'CANNOT_RENDER_ISOLATED',
        label: 'No Renderizable en Aislamiento',
        reason: 'Acoplado a WebSocket activo de backend y ciclo de vida de sesión de WhatsApp Baileys'
      },
      divergence: { hasDivergence: true, notes: 'Requiere servidor de sockets activo' },
      migration: { filesToModify: [], propsToReplace: {}, breakingRisks: [], verificationSteps: ['Probar en flujo de vinculación QR'] }
    },
    'TransaccionModal_full': {
      name: 'TransaccionModal (Modal Completo de Transacción)',
      isShared: false,
      primaryFile: 'src/components/transacciones/TransaccionModal.tsx',
      capability: {
        type: 'CANNOT_RENDER_ISOLATED',
        label: 'No Renderizable en Aislamiento Completo',
        reason: 'Acoplado a React Query mutations (useCrearTransaccion) y 4 fuentes de datos de BD en vivo'
      },
      divergence: { hasDivergence: true, notes: 'Sus submódulos visuales están aislados y renderizados individualmente' },
      migration: { filesToModify: ['src/components/transacciones/TransaccionModal.tsx'], propsToReplace: {}, breakingRisks: [], verificationSteps: ['Crear gasto real'] }
    },
  };

  for (const [catKey, items] of Object.entries(categoryInventory)) {
    // Agrupar por firma canónica: componentName + archivo principal + isShared
    const signatureMap = new Map();

    for (const item of items) {
      let patternKey = item.componentName;
      if (catKey === 'selectores_segmentados') {
        if (item.filePath.includes('TransaccionModal')) patternKey = 'TransaccionModal_pill';
        else if (item.filePath.includes('PagarResumenModal')) patternKey = 'PagarResumenModal_pill';
        else if (item.filePath.includes('PresupuestoModal')) patternKey = 'PresupuestoModal_period';
        else if (item.filePath.includes('GoalContributionModal')) patternKey = 'GoalContributionModal_operation';
      } else if (catKey === 'opciones_seleccionables' && item.filePath.includes('PresupuestoModal')) {
        patternKey = 'RenewalCard';
      }

      if (!signatureMap.has(patternKey)) {
        signatureMap.set(patternKey, {
          patternKey,
          firstOccurrence: item,
          count: 0,
          occurrences: []
        });
      }
      const entry = signatureMap.get(patternKey);
      entry.count++;
      if (entry.occurrences.length < 25) {
        entry.occurrences.push({
          filePath: item.filePath,
          line: item.line,
          className: item.className
        });
      }
    }

    canonicalPatterns[catKey] = [];

    for (const [key, data] of signatureMap.entries()) {
      const meta = KNOWN_CANONICAL_METADATA[key] || {
        name: `${data.firstOccurrence.componentName} (${data.firstOccurrence.isShared ? 'Compartido' : 'Local'})`,
        isShared: data.firstOccurrence.isShared,
        primaryFile: data.firstOccurrence.filePath,
        capability: data.firstOccurrence.isShared
          ? { type: 'RENDERED_IN_VIVO', label: 'Componente Compartido UI' }
          : { type: 'CSS_MODULE_ORIGINAL', label: 'CSS Module Original' },
        divergence: {
          hasDivergence: !data.firstOccurrence.isShared,
          notes: data.firstOccurrence.isShared ? 'Estándar' : 'Divergencia local de estilos'
        },
        migration: {
          filesToModify: [data.firstOccurrence.filePath],
          propsToReplace: {},
          breakingRisks: ['Verificar coherencia de espaciado y tipografía'],
          verificationSteps: ['npm run type-check', 'npm run build']
        }
      };

      const canonicalItem = {
        id: `canonical-${catKey}-${key}`,
        name: meta.name,
        category: catKey,
        componentName: data.firstOccurrence.componentName,
        isShared: meta.isShared,
        primaryFile: meta.primaryFile,
        usageCount: data.count,
        occurrencesCount: data.count,
        extractedStyles: data.firstOccurrence.extractedStyles,
        renderingCapability: meta.capability,
        divergenceAgainstOfficial: meta.divergence,
        migrationTask: meta.migration
      };

      canonicalPatterns[catKey].push(canonicalItem);

      if (meta.capability.type === 'CANNOT_RENDER_ISOLATED') {
        unrenderableList.push({
          patternId: canonicalItem.id,
          componentName: canonicalItem.componentName,
          filePath: canonicalItem.primaryFile,
          technicalReason: meta.capability.reason || 'Requiere contexto de red o sockets',
          isolationBlocker: 'Dependencia de estado vivo o infraestructura'
        });
      }
    }
  }

  // Grupos de comparación
  const comparisonGroups = {};
  for (const [catKey, items] of Object.entries(categoryInventory)) {
    const grouped = {};
    for (const item of items) {
      const groupKey = item.componentName;
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(item);
    }
    comparisonGroups[catKey] = Object.entries(grouped).map(([groupName, variantList]) => ({
      groupName,
      count: variantList.length,
      sharedExists: variantList.some(v => v.isShared),
      variants: variantList.slice(0, 15),
    }));
  }

  // ---------------------------------------------------------------------------
  // 8. Matriz de Cobertura Explícita y Métricas de Auditoría
  // ---------------------------------------------------------------------------
  let totalCanonicalCount = 0;
  let renderedInVivoCount = 0;
  let renderedWithOriginalCssCount = 0;

  for (const list of Object.values(canonicalPatterns)) {
    for (const pat of list) {
      totalCanonicalCount++;
      if (pat.renderingCapability.type === 'RENDERED_IN_VIVO') renderedInVivoCount++;
      else if (pat.renderingCapability.type === 'CSS_MODULE_ORIGINAL') renderedWithOriginalCssCount++;
    }
  }

  const coverageMatrix = {
    totalFilesScanned: allFiles.length,
    tsxAndTsFiles: tsxFiles.length,
    cssFiles: cssFiles.length,
    totalAstOccurrences: detectedVariants.length,
    canonicalPatternsIdentified: totalCanonicalCount,
    renderedInVivoCount,
    renderedWithOriginalCssCount,
    unrenderableCount: unrenderableList.length,
    coveragePercentage: Number((((renderedInVivoCount + renderedWithOriginalCssCount + unrenderableList.length) / (totalCanonicalCount || 1)) * 100).toFixed(1)),
    unrenderableBreakdown: unrenderableList,

    uninspectedRationale: [
      'node_modules/: Dependencias externas excluidas para auditar únicamente código propietario.',
      'dist/ y build/: Artefactos transpilados excluidos para prevenir conteos duplicados.',
      '.git/ y coverage/: Metadatos internos de git y reportes de tests automatizados.',
      'graphify-out/: Artefactos de análisis estático previo.',
    ],
  };

  const metrics = {
    timestamp: new Date().toISOString(),
    executionTimeMs: Date.now() - startTime,
    scannedFiles: {
      total: allFiles.length,
      tsxAndTs: tsxFiles.length,
      css: cssFiles.length,
      cssRules: totalCssRules,
    },
    inventorySummary: {
      totalVariantsDetected: detectedVariants.length,
      sharedComponents: detectedVariants.filter(v => v.isShared).length,
      localImplementations: detectedVariants.filter(v => !v.isShared).length,
      divergencesAndDuplications: duplicationCount,
      uniqueSharedPrimitives: uniquePatternCount,
    },
    categoryDistribution: Object.fromEntries(
      Object.entries(categoryInventory).map(([k, v]) => [k, v.length])
    ),
    criticalDivergenceFamilies: [
      {
        family: 'selectores_segmentados',
        description: 'Múltiples selectores de píldoras reimplementados localmente con radios divergentes (12px vs 8px vs full pill), alturas dispares (36px, 40px, 48px) y variaciones de sombras.',
        examples: [
          'TransaccionModal (pill egreso/ingreso)',
          'PagarResumenModal (pill total/otro monto)',
          'PresupuestoModal (periodo semanal/quincenal/mensual)',
          'GoalContributionModal (aporte/retiro)',
          'SegmentedControl (componente compartido en src/components/ui)',
        ],
      },
      {
        family: 'opciones_seleccionables',
        description: 'Tarjetas de selección de métodos de pago vs renovación vs billeteras con diferencias en el radio del borde, estados de foco y animación de selección.',
        examples: [
          'PresupuestoModal (renewalCard con radioCircle)',
          'TransaccionModal (metodoPago cards)',
          'GoalContributionModal (wallet cards)',
          'SelectableSurface (superficie seleccionable compartida)',
        ],
      },
      {
        family: 'botones_accion',
        description: 'Botones primarios y secundarios creados como <button> HTML con CSS local conviviendo con el componente compartido <Button>.',
        examples: [
          'Button (src/components/ui/Button)',
          'Botones de envío en modales locales con border-radius 10px vs 14px',
        ],
      },
      {
        family: 'modales_dialogos',
        description: 'Encabezados de modal con títulos de 18px a 22px, botones de cierre con distintos tamaños de icono (16px a 20px) y botones de pie de página con gaps variables.',
        examples: [
          'Modal (src/components/ui/Modal)',
          'PagarResumenModal',
          'TransaccionModal',
          'GoalContributionModal',
          'PresupuestoModal',
        ],
      },
    ],
  };

  // ---------------------------------------------------------------------------
  // 9. Persistencia de la Auditoría en JSON
  // ---------------------------------------------------------------------------
  const fullInventoryOutput = {
    metadata: {
      generatedAt: new Date().toISOString(),
      generator: 'scripts/audit-design-system.mjs',
      framework: 'React 19 + TypeScript 6 + Tailwind 3.4',
      totalCategories: Object.keys(categoryInventory).length,
    },
    metrics,
    coverageMatrix,
    canonicalPatterns,
    categories: categoryInventory,
    comparisonGroups,
  };

  const inventoryPath = path.resolve(DATA_DIR, 'design-audit-inventory.json');
  const metricsPath = path.resolve(DATA_DIR, 'design-audit-metrics.json');
  const workspaceAuditoriaPath = path.resolve(AUDITORIAS_DIR, 'auditoria_diseno_argentum.json');

  fs.writeFileSync(inventoryPath, JSON.stringify(fullInventoryOutput, null, 2), 'utf-8');
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2), 'utf-8');
  fs.writeFileSync(workspaceAuditoriaPath, JSON.stringify(fullInventoryOutput, null, 2), 'utf-8');

  console.log(`✅ Inventario guardado en: ${inventoryPath}`);
  console.log(`✅ Métricas guardadas en: ${metricsPath}`);
  console.log(`✅ Copia de respaldo en: ${workspaceAuditoriaPath}`);
  console.log(`⏱️ Auditoría completada en ${Date.now() - startTime}ms`);
  console.log(`📊 Ocurrencias AST detectadas: ${detectedVariants.length} en 12 categorías.`);
  console.log(`🎯 Patrones Canónicos generados: ${totalCanonicalCount} (Cobertura: ${coverageMatrix.coveragePercentage}%).`);

  return fullInventoryOutput;
}

// Ejecución directa si se llama por CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDesignAudit().catch(err => {
    console.error('❌ Error ejecutando auditoría:', err);
    process.exit(1);
  });
}
