import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const star1: Variants = {
  normal: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.25, 0.9, 1],
    rotate: [0, 25, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { scale: 1, rotate: 0 },
};

const star2: Variants = {
  normal: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.3, 0.85, 1],
    rotate: [0, -30, 0],
    transition: { duration: 0.5, delay: 0.1, ease: EASINGS.argentum },
  },
  reduced: { scale: 1, rotate: 0 },
};

export const Sparkles = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.path
          d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
          animate={controls}
          variants={star1}
          style={{ transformOrigin: '12px 12px' }}
        />
        <motion.path
          d="M5 3v4M3 5h4M19 17v4M17 19h4"
          animate={controls}
          variants={star2}
        />
      </motion.svg>
    );
  }
);

Sparkles.displayName = 'Sparkles';
export const SparklesIcon = Sparkles;
