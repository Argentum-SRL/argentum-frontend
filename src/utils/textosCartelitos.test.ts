import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { problemasTextoWeb } from './reglasTextoWeb'

const SRC_ROOT = path.resolve(__dirname, '..')

export interface ProblemaCartelito {
  archivo: string
  linea: number
  texto: string
  codigos: string[]
}

export interface SinResolverCartelito {
  archivo: string
  linea: number
  codigo: string
}

export interface ResultadoEscaneo {
  llamadas: number
  textosRevisados: number
  problemas: ProblemaCartelito[]
  sinResolver: SinResolverCartelito[]
  conDescription: Array<{ archivo: string; linea: number }>
}

interface Resolucion {
  textos: string[]
  sinResolver: boolean
}

const cacheAst = new Map<string, ts.SourceFile>()

function leerSource(archivoAbs: string, contenido?: string): ts.SourceFile {
  if (contenido !== undefined) {
    const kind = archivoAbs.endsWith('.tsx')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS
    return ts.createSourceFile(
      archivoAbs,
      contenido,
      ts.ScriptTarget.Latest,
      true,
      kind
    )
  }
  const hit = cacheAst.get(archivoAbs)
  if (hit) return hit
  const texto = readFileSync(archivoAbs, 'utf-8')
  const kind = archivoAbs.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS
  const sf = ts.createSourceFile(
    archivoAbs,
    texto,
    ts.ScriptTarget.Latest,
    true,
    kind
  )
  cacheAst.set(archivoAbs, sf)
  return sf
}

function resolverRutaImport(desdeAbs: string, spec: string): string | null {
  let base: string
  if (spec.startsWith('@/')) {
    base = path.join(SRC_ROOT, spec.slice(2))
  } else if (spec.startsWith('.')) {
    base = path.resolve(path.dirname(desdeAbs), spec)
  } else {
    return null
  }
  const candidatos = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]
  for (const cand of candidatos) {
    try {
      if (statSync(cand).isFile()) return cand
    } catch {
      // Sigue buscando candidato existente.
    }
  }
  return null
}

function buscarImport(
  sf: ts.SourceFile,
  nombre: string
): { archivoAbs: string; exportado: string } | null {
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue
    if (!ts.isStringLiteral(st.moduleSpecifier)) continue
    const ruta = resolverRutaImport(sf.fileName, st.moduleSpecifier.text)
    if (!ruta) continue
    const ic = st.importClause
    if (ic.name && ic.name.text === nombre) {
      return { archivoAbs: ruta, exportado: 'default' }
    }
    if (ic.namedBindings && ts.isNamedImports(ic.namedBindings)) {
      for (const el of ic.namedBindings.elements) {
        if (el.name.text === nombre) {
          const exp = el.propertyName ? el.propertyName.text : el.name.text
          return { archivoAbs: ruta, exportado: exp }
        }
      }
    }
  }
  return null
}

export function resolverTemplate(node: ts.TemplateExpression): string[] {
  let txt = node.head.text
  for (const span of node.templateSpans) {
    txt += 'X' + span.literal.text
  }
  return [txt]
}

function envolverHookSiAplica(node: ts.Expression): ts.Expression | null {
  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    (node.expression.text === 'useMemo' ||
      node.expression.text === 'useCallback') &&
    node.arguments.length > 0
  ) {
    return node.arguments[0]
  }
  return null
}

function recolectarReturns(fn: ts.Node): ts.Expression[] {
  const res: ts.Expression[] = []
  if (
    (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) &&
    !ts.isBlock(fn.body)
  ) {
    res.push(fn.body)
    return res
  }
  const visitar = (n: ts.Node) => {
    if (
      n !== fn &&
      (ts.isFunctionDeclaration(n) ||
        ts.isFunctionExpression(n) ||
        ts.isArrowFunction(n))
    ) {
      return
    }
    if (ts.isReturnStatement(n) && n.expression) {
      res.push(n.expression)
      return
    }
    ts.forEachChild(n, visitar)
  }
  ts.forEachChild(fn, visitar)
  return res
}

function buscarDeclaracionEnArchivo(
  sf: ts.SourceFile,
  nombre: string
): {
  init: ts.Expression | null
  fnNode: ts.FunctionLikeDeclaration | null
  asignaciones: ts.Expression[]
} {
  let init: ts.Expression | null = null
  let fnNode: ts.FunctionLikeDeclaration | null = null
  const asignaciones: ts.Expression[] = []

  const visitar = (n: ts.Node) => {
    if (ts.isFunctionDeclaration(n) && n.name?.text === nombre) {
      fnNode = n
    } else if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.name.text === nombre &&
      n.initializer
    ) {
      const hookArg = envolverHookSiAplica(n.initializer)
      if (
        ts.isArrowFunction(n.initializer) ||
        ts.isFunctionExpression(n.initializer)
      ) {
        fnNode = n.initializer
      } else if (
        hookArg &&
        (ts.isArrowFunction(hookArg) || ts.isFunctionExpression(hookArg))
      ) {
        fnNode = hookArg
        init = n.initializer
      } else {
        init = n.initializer
      }
    } else if (
      ts.isBinaryExpression(n) &&
      n.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(n.left) &&
      n.left.text === nombre
    ) {
      asignaciones.push(n.right)
    }
    ts.forEachChild(n, visitar)
  }
  ts.forEachChild(sf, visitar)
  return { init, fnNode, asignaciones }
}

function buscarExportEnArchivo(
  sf: ts.SourceFile,
  exportado: string
): { expr: ts.Expression | null; fn: ts.FunctionLikeDeclaration | null } {
  for (const st of sf.statements) {
    if (exportado === 'default' && ts.isExportAssignment(st)) {
      const e = st.expression
      if (ts.isIdentifier(e)) {
        const d = buscarDeclaracionEnArchivo(sf, e.text)
        return { expr: d.init, fn: d.fnNode }
      }
      if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) {
        return { expr: null, fn: e }
      }
      return { expr: e, fn: null }
    }
    if (ts.isFunctionDeclaration(st) && st.name) {
      const esDefault =
        exportado === 'default' &&
        st.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
      if (st.name.text === exportado || esDefault) {
        return { expr: null, fn: st }
      }
    }
    if (ts.isVariableStatement(st)) {
      for (const decl of st.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === exportado) {
          if (decl.initializer) {
            if (
              ts.isArrowFunction(decl.initializer) ||
              ts.isFunctionExpression(decl.initializer)
            ) {
              return { expr: null, fn: decl.initializer }
            }
            return { expr: decl.initializer, fn: null }
          }
        }
      }
    }
  }
  return { expr: null, fn: null }
}

function extraerObjetos(
  expr: ts.Expression,
  sf: ts.SourceFile,
  visitados: Set<string>
): Array<{ obj: ts.ObjectLiteralExpression; sf: ts.SourceFile }> {
  const e = desenrollar(expr)
  if (ts.isObjectLiteralExpression(e)) {
    return [{ obj: e, sf }]
  }
  if (ts.isIdentifier(e)) {
    const key = `obj:${sf.fileName}:${e.text}`
    if (visitados.has(key)) return []
    visitados.add(key)
    const dec = buscarDeclaracionEnArchivo(sf, e.text)
    if (dec.init) {
      return extraerObjetos(dec.init, sf, visitados)
    }
    const imp = buscarImport(sf, e.text)
    if (imp) {
      const otro = leerSource(imp.archivoAbs)
      const exp = buscarExportEnArchivo(otro, imp.exportado)
      if (exp.expr) {
        return extraerObjetos(exp.expr, otro, visitados)
      }
    }
  }
  if (ts.isCallExpression(e)) {
    const fns = resolverFuncion(e.expression, sf, visitados)
    const out: Array<{ obj: ts.ObjectLiteralExpression; sf: ts.SourceFile }> = []
    for (const f of fns) {
      for (const ret of recolectarReturns(f.fn)) {
        out.push(...extraerObjetos(ret, f.sf, visitados))
      }
    }
    return out
  }
  if (ts.isPropertyAccessExpression(e)) {
    const padres = extraerObjetos(e.expression, sf, visitados)
    const out: Array<{ obj: ts.ObjectLiteralExpression; sf: ts.SourceFile }> = []
    for (const p of padres) {
      const val = propiedadDeObjeto(p.obj, e.name.text)
      if (val) out.push(...extraerObjetos(val, p.sf, visitados))
    }
    return out
  }
  return []
}

function propiedadDeObjeto(
  obj: ts.ObjectLiteralExpression,
  nombre: string
): ts.Expression | null {
  for (const prop of obj.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) &&
      prop.name.text === nombre
    ) {
      return prop.initializer
    }
    if (ts.isShorthandPropertyAssignment(prop) && prop.name.text === nombre) {
      return prop.name
    }
  }
  return null
}

function resolverFuncion(
  callee: ts.Expression,
  sf: ts.SourceFile,
  visitados: Set<string>
): Array<{ fn: ts.FunctionLikeDeclaration; sf: ts.SourceFile }> {
  const c = desenrollar(callee)
  if (ts.isIdentifier(c)) {
    const dec = buscarDeclaracionEnArchivo(sf, c.text)
    if (dec.fnNode) return [{ fn: dec.fnNode, sf }]
    const imp = buscarImport(sf, c.text)
    if (imp) {
      const otro = leerSource(imp.archivoAbs)
      const exp = buscarExportEnArchivo(otro, imp.exportado)
      if (exp.fn) return [{ fn: exp.fn, sf: otro }]
    }
  }
  if (ts.isPropertyAccessExpression(c)) {
    const objs = extraerObjetos(c.expression, sf, visitados)
    const out: Array<{ fn: ts.FunctionLikeDeclaration; sf: ts.SourceFile }> = []
    for (const o of objs) {
      const prop = propiedadDeObjeto(o.obj, c.name.text)
      if (!prop) continue
      const p = desenrollar(prop)
      const hookArg = envolverHookSiAplica(p)
      if (ts.isArrowFunction(p) || ts.isFunctionExpression(p)) {
        out.push({ fn: p, sf: o.sf })
      } else if (
        hookArg &&
        (ts.isArrowFunction(hookArg) || ts.isFunctionExpression(hookArg))
      ) {
        out.push({ fn: hookArg, sf: o.sf })
      } else if (ts.isIdentifier(p)) {
        const d = buscarDeclaracionEnArchivo(o.sf, p.text)
        if (d.fnNode) out.push({ fn: d.fnNode, sf: o.sf })
      }
    }
    return out
  }
  return []
}

function desenrollar(expr: ts.Expression): ts.Expression {
  let e = expr
  while (
    ts.isParenthesizedExpression(e) ||
    ts.isAsExpression(e) ||
    ts.isTypeAssertionExpression(e) ||
    ts.isNonNullExpression(e) ||
    ts.isSatisfiesExpression(e)
  ) {
    e = e.expression
  }
  return e
}

function unir(a: Resolucion, b: Resolucion): Resolucion {
  return {
    textos: [...a.textos, ...b.textos],
    sinResolver: a.sinResolver || b.sinResolver,
  }
}

function resolverExpr(
  expr: ts.Expression,
  sf: ts.SourceFile,
  visitados: Set<string>
): Resolucion {
  const e = desenrollar(expr)

  if (
    ts.isStringLiteral(e) ||
    ts.isNoSubstitutionTemplateLiteral(e)
  ) {
    return { textos: [e.text], sinResolver: false }
  }

  if (ts.isTemplateExpression(e)) {
    return { textos: resolverTemplate(e), sinResolver: false }
  }

  if (ts.isConditionalExpression(e)) {
    const r1 = resolverExpr(e.whenTrue, sf, visitados)
    const r2 = resolverExpr(e.whenFalse, sf, visitados)
    return unir(r1, r2)
  }

  if (
    ts.isBinaryExpression(e) &&
    (e.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken ||
      e.operatorToken.kind === ts.SyntaxKind.BarBarToken)
  ) {
    const r1 = resolverExpr(e.left, sf, visitados)
    const r2 = resolverExpr(e.right, sf, visitados)
    return unir(r1, r2)
  }

  if (ts.isCallExpression(e)) {
    const callee = desenrollar(e.expression)
    if (ts.isIdentifier(callee) && callee.text === 'getErrorMessage') {
      if (e.arguments.length < 2) {
        return { textos: [], sinResolver: true }
      }
      return resolverExpr(e.arguments[1], sf, visitados)
    }
    const fns = resolverFuncion(callee, sf, visitados)
    if (fns.length > 0) {
      let acc: Resolucion = { textos: [], sinResolver: false }
      let huboRet = false
      for (const f of fns) {
        const rets = recolectarReturns(f.fn)
        for (const r of rets) {
          huboRet = true
          acc = unir(acc, resolverExpr(r, f.sf, visitados))
        }
      }
      if (huboRet) return acc
    }
    return { textos: [], sinResolver: true }
  }

  if (ts.isPropertyAccessExpression(e)) {
    if (
      e.name.text === 'titulo' &&
      ts.isCallExpression(e.expression) &&
      ts.isIdentifier(e.expression.expression) &&
      e.expression.expression.text === 'parsearAviso'
    ) {
      return { textos: [], sinResolver: false }
    }
    const objs = extraerObjetos(e.expression, sf, visitados)
    if (objs.length > 0) {
      let acc: Resolucion = { textos: [], sinResolver: false }
      let encontrado = false
      for (const o of objs) {
        const prop = propiedadDeObjeto(o.obj, e.name.text)
        if (prop) {
          encontrado = true
          acc = unir(acc, resolverExpr(prop, o.sf, visitados))
        }
      }
      if (encontrado) return acc
    }
    return { textos: [], sinResolver: true }
  }

  if (ts.isIdentifier(e)) {
    const key = `id:${sf.fileName}:${e.text}`
    if (visitados.has(key)) return { textos: [], sinResolver: false }
    const sigVisitados = new Set(visitados)
    sigVisitados.add(key)

    const dec = buscarDeclaracionEnArchivo(sf, e.text)
    if (dec.init || dec.asignaciones.length > 0) {
      let acc: Resolucion = { textos: [], sinResolver: false }
      if (dec.init) {
        const memo = envolverHookSiAplica(dec.init)
        if (memo && (ts.isArrowFunction(memo) || ts.isFunctionExpression(memo))) {
          const rets = recolectarReturns(memo)
          for (const r of rets) {
            acc = unir(acc, resolverExpr(r, sf, sigVisitados))
          }
        } else {
          acc = unir(acc, resolverExpr(dec.init, sf, sigVisitados))
        }
      }
      for (const asig of dec.asignaciones) {
        acc = unir(acc, resolverExpr(asig, sf, sigVisitados))
      }
      return acc
    }
    const imp = buscarImport(sf, e.text)
    if (imp) {
      const otro = leerSource(imp.archivoAbs)
      const exp = buscarExportEnArchivo(otro, imp.exportado)
      if (exp.expr) {
        return resolverExpr(exp.expr, otro, sigVisitados)
      }
    }
    return { textos: [], sinResolver: true }
  }

  return { textos: [], sinResolver: true }
}

function limpiarW8(codigos: string[]): string[] {
  return codigos.filter((c) => c !== 'W8_SIN_RELLENAR')
}

export function analizarCodigoCartelitos(
  fuente: string,
  archivo = 'muestra.tsx'
): ResultadoEscaneo {
  const sf = leerSource(archivo, fuente)
  return analizarSourceFile(sf, archivo)
}

function analizarSourceFile(
  sf: ts.SourceFile,
  rel: string
): ResultadoEscaneo {
  const res: ResultadoEscaneo = {
    llamadas: 0,
    textosRevisados: 0,
    problemas: [],
    sinResolver: [],
    conDescription: [],
  }

  const visitar = (n: ts.Node) => {
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      ts.isIdentifier(n.expression.expression) &&
      n.expression.expression.text === 'sileo'
    ) {
      res.llamadas += 1
      const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf))
      const linea = line + 1
      const arg = n.arguments[0]
      if (!arg || !ts.isObjectLiteralExpression(desenrollar(arg))) {
        res.sinResolver.push({
          archivo: rel,
          linea,
          codigo: n.getText(sf),
        })
      } else {
        const obj = desenrollar(arg) as ts.ObjectLiteralExpression
        const descExpr = propiedadDeObjeto(obj, 'description')
        if (descExpr) {
          res.conDescription.push({ archivo: rel, linea })
        }
        const titleExpr = propiedadDeObjeto(obj, 'title')
        if (!titleExpr) {
          res.sinResolver.push({
            archivo: rel,
            linea,
            codigo: obj.getText(sf),
          })
        } else {
          const r = resolverExpr(titleExpr, sf, new Set())
          if (r.sinResolver) {
            res.sinResolver.push({
              archivo: rel,
              linea,
              codigo: titleExpr.getText(sf),
            })
          }
          for (const txt of r.textos) {
            res.textosRevisados += 1
            const codigos = limpiarW8(problemasTextoWeb(txt))
            if (codigos.length > 0) {
              res.problemas.push({
                archivo: rel,
                linea,
                texto: txt,
                codigos,
              })
            }
          }
        }
      }
    }
    ts.forEachChild(n, visitar)
  }

  ts.forEachChild(sf, visitar)
  return res
}

function listarArchivosSrc(dir: string): string[] {
  const out: string[] = []
  for (const ent of readdirSync(dir)) {
    const full = path.join(dir, ent)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...listarArchivosSrc(full))
    } else if (
      (ent.endsWith('.ts') || ent.endsWith('.tsx')) &&
      !ent.endsWith('.test.ts') &&
      !ent.endsWith('.test.tsx') &&
      !ent.endsWith('.spec.ts') &&
      !ent.endsWith('.spec.tsx')
    ) {
      out.push(full)
    }
  }
  return out
}

describe('textosCartelitos', () => {
  it('TW5 detecta problemas, expresiones sin resolver y templates', () => {
    const muestra = [
      "sileo.success({ title: 'Meta creada con éxito' })",
      'sileo.error({ title: algo.raro })',
    ].join('\n')
    const res = analizarCodigoCartelitos(muestra, 'muestra.tsx')
    expect(res.problemas).toHaveLength(1)
    expect(res.sinResolver).toHaveLength(1)

    const muestraTpl = 'sileo.info({ title: `Meta ${nombre} creada con éxito` })'
    const resTpl = analizarCodigoCartelitos(muestraTpl, 'tpl.tsx')
    expect(resTpl.problemas).toHaveLength(1)
  })

  it(
    'todos los cartelitos (sileo) de src cumplen REGLAS_TEXTOS_WEB',
    () => {
      cacheAst.clear()
      const archivos = listarArchivosSrc(SRC_ROOT)
      let llamadas = 0
      let textosRevisados = 0
      const problemas: ProblemaCartelito[] = []
      const sinResolver: SinResolverCartelito[] = []
      const conDescription: Array<{ archivo: string; linea: number }> = []

      for (const abs of archivos) {
        if (!readFileSync(abs, 'utf-8').includes('sileo')) continue
        const rel = path.relative(SRC_ROOT, abs).replace(/\\/g, '/')
        const sf = leerSource(abs)
        const parcial = analizarSourceFile(sf, rel)
        llamadas += parcial.llamadas
        textosRevisados += parcial.textosRevisados
        problemas.push(...parcial.problemas)
        sinResolver.push(...parcial.sinResolver)
        conDescription.push(...parcial.conDescription)
      }

    console.log(
      `ESCANER_CARTELITOS: llamadas=${llamadas}, textos=${textosRevisados}`
    )

    if (conDescription.length > 0) {
      console.error('CON_DESCRIPTION:', conDescription)
    }
    if (sinResolver.length > 0) {
      console.error('SIN_RESOLVER:', sinResolver)
    }
    if (problemas.length > 0) {
      console.error('PROBLEMAS:', problemas)
    }

    expect(llamadas).toBeGreaterThanOrEqual(280)
    expect(conDescription).toEqual([])
    expect(sinResolver).toEqual([])
    expect(problemas).toEqual([])
  }, 20_000)
})
