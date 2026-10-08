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
    y: [0, 2, 0],
    transition: { duration: 0.45, delay: 0.1, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0 },
};

export const TrendingDown = forwardRef<SVGSVGElement, IconProps>(
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
          d="m22 17-8.5-8.5-5 5L2 7"
          animate={controls}
          variants={pathVariants}
        />
        <motion.polyline
          points="16 17 22 17 22 11"
          animate={controls}
          variants={arrowVariants}
        />
      </motion.svg>
    );
  }
);

TrendingDown.displayName = 'TrendingDown';
export const TrendingDownIcon = TrendingDown;
