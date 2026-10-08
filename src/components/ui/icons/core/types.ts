import type { SVGMotionProps, useAnimation } from 'motion/react';

export type Controls = ReturnType<typeof useAnimation>;

export interface IconProps extends Omit<SVGMotionProps<SVGSVGElement>, 'animate'> {
  size?: number | string;
  strokeWidth?: number | string;
  isHovered?: boolean;
  className?: string;
  title?: string;
  animate?: SVGMotionProps<SVGSVGElement>['animate'];
}

export type MotionSignature =
  | 'directional-flow'
  | 'optical-sweep'
  | 'pendulum'
  | 'lid-open'
  | 'document-slide'
  | 'path-draw'
  | 'pencil-sketch'
  | 'gear-rotate'
  | 'wallet-clasp'
  | 'card-glide'
  | 'iris-blink'
  | 'ring-focus'
  | 'trend-flow'
  | 'calendar-flip'
  | 'clock-tick'
  | 'sync-spin'
  | 'filter-slide'
  | 'shackle-unlock'
  | 'star-sparkle'
  | 'sun-burst'
  | 'moon-tilt'
  | 'alert-bounce'
  | 'info-nod'
  | 'disk-click'
  | 'trophy-lift'
  | 'bill-float'
  | 'globe-spin'
  | 'envelope-open'
  | 'stagger-wave'
  | 'shutter-snap'
  | 'paper-feed'
  | 'tray-drop'
  | 'arrow-launch'
  | 'arrow-thrust'
  | 'directional-nudge'
  | 'cross-rotate'
  | 'avatar-nod'
  | 'exit-door'
  | 'smooth-spin';
