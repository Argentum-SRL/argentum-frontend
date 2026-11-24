import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import PageSummaryBar from './PageSummaryBar'

const ROOT_DIR = process.cwd()

describe('PageSummaryBar unificado', () => {
  it('renderiza ítems básicos, subValue, highlight y notice nativo', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageSummaryBar, {
        mobileVariant: 'none',
        items: [
          {
            label: 'Gastado este ciclo',
            value: '$ 117.577,25',
            highlight: true,
            notice: {
              text: React.createElement(
                React.Fragment,
                null,
                'Límite total asignado ',
                React.createElement('strong', null, '$ 100.000')
              ),
              tooltip: 'Límite total asignado $ 100.000',
            },
          },
          {
            label: 'Del límite total',
            value: '117.6%',
            tone: 'negative',
            subValue: 'excedido',
          },
        ],
      })
    )

    expect(html).toContain('Gastado este ciclo')
    expect(html).toContain('$ 117.577,25')
    expect(html).toContain('Límite total asignado')
    expect(html).toContain('$ 100.000')
    expect(html).toContain('Del límite total')
    expect(html).toContain('117.6%')
    expect(html).toContain('excedido')
    expect(html).toContain('hideMobile')
    expect(html).toContain('itemWithNotice')
    expect(html).toContain('colorRed')
  })

  it('soporta todos los valores semánticos de tone', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageSummaryBar, {
        items: [
          { label: 'Neutro', value: '1', tone: 'default' },
          { label: 'Positivo', value: '2', tone: 'positive' },
          { label: 'Advertencia', value: '3', tone: 'warning' },
          { label: 'Negativo', value: '4', tone: 'negative' },
        ],
      })
    )

    expect(html.match(/colorGreen/g)).toHaveLength(1)
    expect(html.match(/colorOrange/g)).toHaveLength(1)
    expect(html.match(/colorRed/g)).toHaveLength(1)
  })

  it('renderiza mobileVariant="strip" con mobileItems y mobileNotice junto con la barra desktop', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageSummaryBar, {
        mobileVariant: 'strip',
        items: [
          {
            label: 'Balance del ciclo',
            value: '+$ 50.000',
            highlight: true,
            notice: { text: 'Texto desktop largo' },
          },
          { label: 'Ingresos', value: '+$ 100.000', tone: 'positive' },
          { label: 'Egresos', value: '-$ 50.000', tone: 'negative' },
        ],
        mobileItems: [
          { label: 'Balance', value: '+$ 50.000', tone: 'positive' },
          { label: 'Ingresos', value: '+$ 100.000', tone: 'positive' },
          { label: 'Egresos', value: '-$ 50.000', tone: 'negative' },
        ],
        mobileNotice: { text: 'Texto mobile corto' },
      })
    )

    expect(html).toContain('mobileStrip')
    expect(html).toContain('Balance del ciclo')
    expect(html).toContain('Balance')
    expect(html).toContain('Texto desktop largo')
    expect(html).toContain('Texto mobile corto')
    expect(html).toContain('stripColorGreen')
    expect(html).toContain('stripColorRed')
  })

  it('ningún módulo unificado duplica .mobileSplitStrip, .desktopSummaryBar, .resumenSlot, .balanceCicloSlot ni .metricsBar', () => {
    const filesToCheck = [
      'src/pages/app/presupuestos/PresupuestosPage.tsx',
      'src/pages/app/presupuestos/PresupuestosPage.module.css',
      'src/pages/app/transacciones/TransaccionesPage.tsx',
      'src/pages/app/transacciones/TransaccionesPage.module.css',
      'src/components/transacciones/GruposCuotasTab.tsx',
      'src/components/transacciones/GruposCuotasTab.parte1.css',
      'src/pages/app/analisis/NumerosPrincipales.tsx',
      'src/pages/app/analisis/ViewerKpisBlock.tsx',
      'src/pages/app/analisis/AnalisisPage.module.css',
      'src/pages/app/analisis/ViewerKpisBlock.module.css',
      'src/pages/app/billeteras/BilleterasPage.tsx',
      'src/pages/app/billeteras/BilleterasPage.module.css',
      'src/pages/app/metas/MetasPage.tsx',
      'src/pages/app/metas/MetasPage.module.css',
      'src/pages/app/suscripciones/SuscripcionesPage.tsx',
      'src/pages/app/suscripciones/SuscripcionesPage.module.css',
    ]

    const legacyTokens = [
      'mobileSplitStrip',
      'desktopSummaryBar',
      'resumenSlot',
      'balanceCicloSlot',
      'metricsBar',
    ]

    for (const rel of filesToCheck) {
      const content = fs.readFileSync(path.resolve(ROOT_DIR, rel), 'utf-8')
      for (const token of legacyTokens) {
        expect(content, `${rel} no debe contener ${token}`).not.toContain(token)
      }
    }
  })

  it('GruposCuotasTab, Presupuestos, Transacciones, Analisis, Billeteras, Metas y Suscripciones importan PageSummaryBar', () => {
    const pagesUsingSummaryBar = [
      'src/pages/app/presupuestos/PresupuestosPage.tsx',
      'src/pages/app/transacciones/TransaccionesPage.tsx',
      'src/components/transacciones/GruposCuotasTab.tsx',
      'src/pages/app/analisis/NumerosPrincipales.tsx',
      'src/pages/app/analisis/ViewerKpisBlock.tsx',
      'src/pages/app/billeteras/BilleterasPage.tsx',
      'src/pages/app/metas/MetasPage.tsx',
      'src/pages/app/suscripciones/SuscripcionesPage.tsx',
      'src/pages/AdminPage.tsx',
      'src/pages/admin/components/MonitorWppPanel.tsx',
    ]

    for (const rel of pagesUsingSummaryBar) {
      const content = fs.readFileSync(path.resolve(ROOT_DIR, rel), 'utf-8')
      expect(content, `${rel} debe usar PageSummaryBar`).toContain('PageSummaryBar')
    }
  })

  it('PageSummaryBar.module.css no usa !important ni word-break y define reglas dark mode', () => {
    const cssPath = path.resolve(ROOT_DIR, 'src/components/ui/PageSummaryBar/PageSummaryBar.module.css')
    const content = fs.readFileSync(cssPath, 'utf-8')

    expect(content).not.toContain('!important')
    expect(content).not.toContain('word-break')
    expect(content).toContain('container-type: inline-size')
    expect(content).toContain('[data-theme="dark"]')
  })
})
