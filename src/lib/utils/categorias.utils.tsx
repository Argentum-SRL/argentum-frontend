import { ShoppingBag, Navigation, Coffee, TrendingUp, Home, Package, Zap, Heart, MoreHorizontal } from 'lucide-react'

interface CategoriaMeta {
  bg: string
  stroke: string
  icon: React.ReactNode
}

export const CATEGORIA_META: Record<string, CategoriaMeta> = {
  supermercado:  { bg: '#EAF3DE', stroke: '#3B6D11', icon: <ShoppingBag size={18} strokeWidth={1.75} /> },
  transporte:    { bg: '#EDF2F7', stroke: '#52565F', icon: <Navigation size={18} strokeWidth={1.75} /> },
  salidas:       { bg: '#FAECE7', stroke: '#993C1D', icon: <Coffee size={18} strokeWidth={1.75} /> },
  ingreso:       { bg: '#E6F1FB', stroke: '#185FA5', icon: <TrendingUp size={18} strokeWidth={1.75} /> },
  vivienda:      { bg: '#F5F4F0', stroke: '#52565F', icon: <Home size={18} strokeWidth={1.75} /> },
  suscripciones: { bg: '#F3EEF8', stroke: '#6B2E8A', icon: <Package size={18} strokeWidth={1.75} /> },
  servicios:     { bg: '#FFF9E6', stroke: '#A07800', icon: <Zap size={18} strokeWidth={1.75} /> },
  salud:         { bg: '#FDEAEA', stroke: '#C0392B', icon: <Heart size={18} strokeWidth={1.75} /> },
}

const DEFAULT_META: CategoriaMeta = {
  bg: '#F5F4F0',
  stroke: '#8E9198',
  icon: <MoreHorizontal size={18} strokeWidth={1.75} />,
}

export function getCategoriaMeta(categoria: string): CategoriaMeta {
  return CATEGORIA_META[categoria] ?? DEFAULT_META
}
