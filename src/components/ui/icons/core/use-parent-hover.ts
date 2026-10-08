import { useEffect, useRef, useCallback, useState } from 'react';
import { useAnimation } from 'motion/react';
import type { Controls } from './types';

export interface UseParentHoverOptions {
  isHovered?: boolean;
}

export interface UseParentHoverResult {
  svgRef: React.RefObject<SVGSVGElement | null>;
  controls: Controls;
  isReducedMotion: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
}

export function mergeRefs<T>(
  ...refs: (React.ForwardedRef<T> | React.Ref<T> | undefined)[]
) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    }
  };
}

export function useParentHover({ isHovered }: UseParentHoverOptions = {}): UseParentHoverResult {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const controls = useAnimation();
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const isPlayingRef = useRef(false);

  // Subscribe to prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const listener = (event: MediaQueryListEvent) => {
      setIsReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const startAnimation = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    if (isReducedMotion) {
      controls.start('reduced').catch(() => {});
    } else {
      controls.start('animate').catch(() => {});
    }
  }, [controls, isReducedMotion]);

  const stopAnimation = useCallback(() => {
    isPlayingRef.current = false;
    controls.start('normal').catch(() => {});
  }, [controls]);

  // Handle controlled isHovered prop
  useEffect(() => {
    if (isHovered !== undefined) {
      if (isHovered) {
        startAnimation();
      } else {
        stopAnimation();
      }
    }
  }, [isHovered, startAnimation, stopAnimation]);

  // Automatic parent container hover/focus/touch detection
  useEffect(() => {
    if (isHovered !== undefined) return;

    const el = svgRef.current;
    if (!el) return;

    const parent = el.closest<HTMLElement>(
      'button, a, [role="button"], [data-icon-parent], .group, label, summary'
    );

    if (!parent) return;

    const onEnter = () => startAnimation();
    const onLeave = () => stopAnimation();

    parent.addEventListener('mouseenter', onEnter);
    parent.addEventListener('mouseleave', onLeave);
    parent.addEventListener('focus', onEnter);
    parent.addEventListener('blur', onLeave);
    parent.addEventListener('touchstart', onEnter, { passive: true });
    parent.addEventListener('touchend', onLeave, { passive: true });

    return () => {
      parent.removeEventListener('mouseenter', onEnter);
      parent.removeEventListener('mouseleave', onLeave);
      parent.removeEventListener('focus', onEnter);
      parent.removeEventListener('blur', onLeave);
      parent.removeEventListener('touchstart', onEnter);
      parent.removeEventListener('touchend', onLeave);
    };
  }, [isHovered, startAnimation, stopAnimation]);

  const handleMouseEnter = useCallback(() => {
    if (isHovered === undefined) {
      startAnimation();
    }
  }, [isHovered, startAnimation]);

  const handleMouseLeave = useCallback(() => {
    if (isHovered === undefined) {
      stopAnimation();
    }
  }, [isHovered, stopAnimation]);

  const handleTouchStart = useCallback(() => {
    if (isHovered === undefined) {
      startAnimation();
    }
  }, [isHovered, startAnimation]);

  const handleTouchEnd = useCallback(() => {
    if (isHovered === undefined) {
      stopAnimation();
    }
  }, [isHovered, stopAnimation]);

  return {
    svgRef,
    controls,
    isReducedMotion,
    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    handleTouchEnd,
  };
}
