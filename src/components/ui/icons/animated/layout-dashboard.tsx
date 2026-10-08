import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const rectTopLeft: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.08, 1],
    transition: { duration: 0.4, ease: EASINGS.argentum },
  },
  reduced: { scale: 1 },
};

const rectBottomRight: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.08, 1],
    transition: { duration: 0.4, delay: 0.08, ease: EASINGS.argentum },
  },
  reduced: { scale: 1 },
};

export const LayoutDashboard = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.rect
          width="7"
          height="9"
          x="3"
          y="3"
          rx="1"
          animate={controls}
          variants={rectTopLeft}
          style={{ transformOrigin: '6.5px 7.5px' }}
        />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <motion.rect
          width="7"
          height="5"
          x="3"
          y="16"
          rx="1"
          animate={controls}
          variants={rectBottomRight}
          style={{ transformOrigin: '6.5px 18.5px' }}
        />
      </motion.svg>
    );
  }
);

LayoutDashboard.displayName = 'LayoutDashboard';
export const LayoutDashboardIcon = LayoutDashboard;
