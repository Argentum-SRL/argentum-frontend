import { Scale, HelpCircle, FileSpreadsheet } from '@/components/ui/icons';

export type TabId = 'conveniencia' | 'can-afford' | 'importar-resumen';

export interface TabItem {
  id: TabId;
  title: string;
  icon: typeof Scale;
  adminOnly?: boolean;
}

export const TOOL_TABS: TabItem[] = [
  {
    id: 'conveniencia',
    title: 'Cuotas vs Contado',
    icon: Scale,
  },
  {
    id: 'can-afford',
    title: '¿Me lo puedo permitir?',
    icon: HelpCircle,
  },
  {
    id: 'importar-resumen',
    title: 'Importar Resumen',
    icon: FileSpreadsheet,
    adminOnly: true,
  },
];

/**
 * Devuelve la pestaña inicial si existe y es visible para la persona;
 * en caso contrario devuelve 'conveniencia'.
 */
export function pestanaInicial(rawTab: string | null, esAdmin: boolean): TabId {
  if (!rawTab) return 'conveniencia';
  const encontrada = TOOL_TABS.find(
    (tab) => tab.id === rawTab && (!tab.adminOnly || esAdmin)
  );
  return encontrada ? encontrada.id : 'conveniencia';
}
