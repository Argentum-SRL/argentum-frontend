import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { PerfilResumen } from '@/types'
import { armarVistaPerfil } from './perfilVista'

const PA_RESPUESTA: PerfilResumen = {
  mostrar: true,
  moneda: 'ARS',
  titulo: 'Tu perfil financiero',
  subtitulo: 'Tus últimos 6 meses terminados',
  resumen: 'Venís bien en 2 de 4.',
  aviso: null,
  filas: [
    {
      id: 'sobra',
      titulo: '¿Te sobra plata?',
      estado: 'bien',
      texto: 'Te sobró en 5 de 6 meses: unos $133.000 por mes (11% de lo que entra).',
      notas: [],
      accion: null,
    },
    {
      id: 'bancas',
      titulo: 'Si un mes no entrara plata',
      estado: 'atencion',
      texto: 'Te bancás 2 meses. Recortando lo que no es imprescindible, 3 meses.',
      notas: ['Sin contar $900.000 que tenés invertidos.'],
      accion: {
        tipo: 'crear_meta',
        texto_boton: 'Crear meta',
        nombre: 'Imprevistos',
        monto: 3075000,
        moneda: 'ARS',
      },
    },
    {
      id: 'cuotas',
      titulo: 'Lo que ya está atado a cuotas',
      estado: 'bien',
      texto: '$152.500 por mes: el 13% de lo que entra.',
      notas: [
        'Los bancos ponen el límite en el 25%.',
        'En abril de 2027 terminás de pagar «Heladera» y baja a $72.500.',
      ],
      accion: null,
    },
    {
      id: 'inflacion',
      titulo: 'Contra la inflación',
      estado: 'atencion',
      texto: 'Lo que te entra hoy compra un 4% menos que hace un año.',
      notas: ['Con datos del INDEC hasta octubre.'],
      accion: null,
    },
  ],
  mostrar_modal_bienvenida: true,
}

const PC_RESPUESTA: PerfilResumen = {
  mostrar: true,
  moneda: 'ARS',
  titulo: 'Tu perfil financiero',
  subtitulo: null,
  resumen: null,
  aviso: null,
  filas: [
    {
      id: 'cuotas',
      titulo: 'Lo que ya está atado a cuotas',
      estado: 'neutral',
      texto: '$30.000 por mes.',
      notas: ['En marzo de 2027 terminás de pagar «Zapatillas» y no te queda nada en cuotas.'],
      accion: null,
    },
  ],
  mostrar_modal_bienvenida: true,
}

describe('armarVistaPerfil y textos sin jerga', () => {
  it('arma PA con 4 filas en orden, iconos y sugerencia de meta en bancas', () => {
    const vista = armarVistaPerfil(PA_RESPUESTA)
    expect(vista).not.toBeNull()
    expect(vista?.filas.map((f) => f.id)).toEqual(['sobra', 'bancas', 'cuotas', 'inflacion'])
    expect(vista?.filas.map((f) => f.icono)).toEqual(['bien', 'atencion', 'bien', 'atencion'])
    const bancas = vista?.filas[1]
    expect(bancas?.textoBoton).toBe('Crear meta')
    expect(bancas?.sugerenciaMeta).toEqual({
      nombre: 'Imprevistos',
      monto_objetivo: 3075000,
      moneda: 'ARS',
    })
  })

  it('arma PC con 1 fila neutral sin icono ni etiquetaIcono', () => {
    const vista = armarVistaPerfil(PC_RESPUESTA)
    expect(vista).not.toBeNull()
    expect(vista?.filas).toHaveLength(1)
    expect(vista?.filas[0].icono).toBeNull()
    expect(vista?.filas[0].etiquetaIcono).toBeNull()
  })

  it('devuelve null con mostrar false o null', () => {
    expect(armarVistaPerfil(null)).toBeNull()
    expect(
      armarVistaPerfil({
        mostrar: false,
        moneda: 'ARS',
        titulo: 'Tu perfil financiero',
        subtitulo: null,
        resumen: null,
        aviso: null,
        filas: [],
        mostrar_modal_bienvenida: false,
      }),
    ).toBeNull()
  })

  it('PerfilFinancieroCard y la pestaña perfil del modal no tienen jerga y tienen los 7 textos', () => {
    const srcDir = path.resolve(__dirname, '../..')
    const cardTxt = fs.readFileSync(
      path.join(srcDir, 'components/perfil/PerfilFinancieroCard.tsx'),
      'utf-8',
    )
    const modalFullTxt = fs.readFileSync(
      path.join(
        srcDir,
        'components/dashboard/ExplicativoFinancieroModal/ExplicativoFinancieroModal.tsx',
      ),
      'utf-8',
    )
    const tabPerfilTxt = modalFullTxt.split("activeTab === 'perfil' ? (")[1].split(') : (')[0]

    const prohibidas = [
      'Confianza',
      'continuidad',
      'Volatilidad',
      'Cobertura',
      'Runway',
      'percentil',
      'deflact',
      'Actualizar',
      'recalcular',
    ]
    for (const palabra of prohibidas) {
      expect(cardTxt).not.toContain(palabra)
      expect(tabPerfilTxt).not.toContain(palabra)
    }

    const textosModal = [
      'Tu perfil financiero contesta cuatro preguntas sobre tus últimos 6 meses terminados. Cada una aparece cuando hay datos para contestarla.',
      'Las cuatro preguntas',
      'En cuántos de tus últimos meses te entró más de lo que gastaste y cuánto te quedó en promedio. Es el mismo balance que ves en Análisis. Aparece con 3 meses terminados.',
      'Cuántos meses podrías pagar tus gastos de siempre con la plata de tus cuentas, tus dólares y tus metas para imprevistos. Lo invertido no cuenta. Lo recomendable es tener de 3 a 6 meses. Aparece con 1 mes terminado.',
      'Cuánto pagás por mes de compras en cuotas y qué parte de lo que te entra se lleva. Los bancos ponen el límite en el 25%. Aparece desde el primer día.',
      'Si lo que te entra hoy compra más o menos que antes, con la inflación del INDEC. Aparece con 6 meses terminados.',
      'Arriba te decimos en cuántas de estas preguntas venís bien. Nunca te pedimos cuánto cobrás: lo sacamos de tus movimientos.',
    ]
    for (const t of textosModal) {
      expect(tabPerfilTxt).toContain(t)
    }
  })
})
