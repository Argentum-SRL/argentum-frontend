import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';

const bellVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, -14, 12, -7, 3, 0],
    transition: { duration: 0.65, ease: 'easeInOut' },
  },
  reduced: { rotate: 0 },
};

const clapperVariants: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, 2, -2, 1, 0],
    transition: { duration: 0.65, ease: 'easeInOut' },
  },
  reduced: { x: 0 },
};

export const Bell = forwardRef<SVGSVGElement, IconProps>(
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
          d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
          animate={controls}
          variants={bellVariants}
          style={{ transformOrigin: '12px 2px' }}
        />
        <motion.path
          d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
          animate={controls}
          variants={clapperVariants}
        />
      </motion.svg>
    );
  }
);

Bell.displayName = 'Bell';
export const BellIcon = Bell;
