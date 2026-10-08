import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const pathVariants: Variants = {
  normal: { pathLength: 1, opacity: 1 },
  animate: {
    pathLength: [0, 1],
    opacity: 1,
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { pathLength: 1, opacity: 1 },
};

const arrowVariants: Variants = {
  normal: { x: 0, y: 0 },
  animate: {
    x: [0, 2, 0],
    y: [0, -2, 0],
    transition: { duration: 0.45, delay: 0.1, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0 },
};

export const TrendingUp = forwardRef<SVGSVGElement, IconProps>(
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
          d="M22 7 13.5 15.5 8.5 10.5 2 17"
          animate={controls}
          variants={pathVariants}
        />
        <motion.polyline
          points="16 7 22 7 22 13"
          animate={controls}
          variants={arrowVariants}
        />
      </motion.svg>
    );
  }
);

TrendingUp.displayName = 'TrendingUp';
export const TrendingUpIcon = TrendingUp;
