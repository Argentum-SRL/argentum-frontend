import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const topLayer: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2.5, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

const bottomLayer: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, 2.5, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

export const Layers = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, isHovered, ...props }, ref) => {
    const { svgRef, controls, handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd } =
      useParentHover({ isHovered });

    return (
      <motion.svg
        ref={mergeRefs(svgRef, ref)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        <motion.polygon
          points="12 2 2 7 12 12 22 7 12 2"
          animate={controls}
          variants={topLayer}
        />
        <polyline points="2 17 12 22 22 17" />
        <motion.polyline
          points="2 12 12 17 22 12"
          animate={controls}
          variants={bottomLayer}
        />
      </motion.svg>
    );
  }
);

Layers.displayName = 'Layers';
export const LayersIcon = Layers;
