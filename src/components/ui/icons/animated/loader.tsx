import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { LunarLoader } from '@/components/ui/LunarLoader';
import type { IconProps } from '../core/types';

/**
 * Loader2 — Representación oficial de Argentum para estados de carga.
 * Implementa la transformación continua de fases lunares y eclipse del Hero Loader,
 * reemplazando el spinner genérico por la identidad lunar propia de Argentum.
 */
export const Loader2 = forwardRef<HTMLSpanElement, IconProps>(
  ({ size = 24, className, color, style, title, ...props }, ref) => {
    return (
      <LunarLoader
        ref={ref}
        size={size}
        className={className}
        color={typeof color === 'string' ? color : undefined}
        style={style as unknown as CSSProperties | undefined}
        aria-label={title || 'Cargando...'}
        {...(props as unknown as HTMLAttributes<HTMLSpanElement>)}
      />
    );
  }
);

Loader2.displayName = 'Loader2';
export const Loader2Icon = Loader2;
export const LoaderCircle = Loader2;
export const LoaderCircleIcon = Loader2;
export { LunarLoader };
