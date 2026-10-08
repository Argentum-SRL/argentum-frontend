import type { Variants, Variant } from 'motion/react';
import { EASINGS } from '../motion/easings';

export interface PrimitiveOptions {
  duration?: number;
  delay?: number;
  ease?: unknown;
}

export function DrawPath({
  duration = 0.5,
  delay = 0,
  ease = EASINGS.argentum,
}: PrimitiveOptions = {}): Variants {
  return {
    normal: { pathLength: 1, opacity: 1 },
    animate: {
      pathLength: [0, 1],
      opacity: 1,
      transition: { duration, delay, ease },
    } as unknown as Variant,
    reduced: { pathLength: 1, opacity: 1 },
  };
}

export function SlidePart(
  axis: 'x' | 'y',
  distance: number,
  { duration = 0.4, delay = 0, ease = EASINGS.argentum }: PrimitiveOptions = {}
): Variants {
  return {
    normal: { [axis]: 0 },
    animate: {
      [axis]: [0, distance, 0],
      transition: { duration, delay, ease },
    } as unknown as Variant,
    reduced: { [axis]: 0 },
  };
}

export function RotatePart(
  angles: number | number[],
  { duration = 0.4, delay = 0, ease = EASINGS.argentum }: PrimitiveOptions = {}
): Variants {
  const rotateValues = Array.isArray(angles) ? [0, ...angles, 0] : [0, angles, 0];
  return {
    normal: { rotate: 0 },
    animate: {
      rotate: rotateValues,
      transition: { duration, delay, ease },
    } as unknown as Variant,
    reduced: { rotate: 0 },
  };
}

export function SwingPart(
  amplitude = 12,
  { duration = 0.5, delay = 0 }: PrimitiveOptions = {}
): Variants {
  return {
    normal: { rotate: 0 },
    animate: {
      rotate: [0, -amplitude, amplitude * 0.8, -amplitude * 0.4, amplitude * 0.2, 0],
      transition: { duration, delay, ease: 'easeInOut' },
    } as unknown as Variant,
    reduced: { rotate: 0 },
  };
}

export function DirectionalFlow(
  axis: 'x' | 'y',
  distance: number,
  { duration = 0.5, delay = 0, ease = EASINGS.argentum }: PrimitiveOptions = {}
): Variants {
  return {
    normal: { [axis]: 0, opacity: 1 },
    animate: {
      [axis]: [0, distance, 0],
      opacity: 1,
      transition: { duration, delay, ease },
    } as unknown as Variant,
    reduced: { [axis]: 0 },
  };
}

export function PulsePart(
  scaleTo = 1.15,
  { duration = 0.35, delay = 0 }: PrimitiveOptions = {}
): Variants {
  return {
    normal: { scale: 1 },
    animate: {
      scale: [1, scaleTo, 1],
      transition: { duration, delay, ease: EASINGS.gentle },
    } as unknown as Variant,
    reduced: { scale: 1 },
  };
}

export function Reveal(
  { duration = 0.3, delay = 0 }: PrimitiveOptions = {}
): Variants {
  return {
    normal: { opacity: 1, scale: 1 },
    animate: {
      opacity: [0.3, 1],
      scale: [0.92, 1],
      transition: { duration, delay, ease: EASINGS.argentum },
    } as unknown as Variant,
    reduced: { opacity: 1, scale: 1 },
  };
}

export function StaggerPaths(
  pathsCount: number,
  baseDuration = 0.3,
  staggerInterval = 0.08
): Variants[] {
  return Array.from({ length: pathsCount }, (_, i) => ({
    normal: { pathLength: 1, opacity: 1 },
    animate: {
      pathLength: [0, 1],
      opacity: 1,
      transition: {
        duration: baseDuration,
        delay: i * staggerInterval,
        ease: EASINGS.argentum,
      },
    } as unknown as Variant,
    reduced: { pathLength: 1, opacity: 1 },
  }));
}
