import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const raysVariants: Variants = {
  normal: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.15, 1],
    rotate: [0, 45],
    transition: { duration: 0.6, ease: EASINGS.argentum },
  },
  reduced: { scale: 1, rotate: 0 },
};

export const Sun = forwardRef<SVGSVGElement, IconProps>(
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
        <circle cx="12" cy="12" r="4" />
        <motion.g
          animate={controls}
          variants={raysVariants}
          style={{ transformOrigin: '12px 12px' }}
        >
          <line x1="12" x2="12" y1="2" y2="4" />
          <line x1="12" x2="12" y1="20" y2="22" />
          <line x1="4.93" x2="6.34" y1="4.93" y2="6.34" />
          <line x1="17.66" x2="19.07" y1="17.66" y2="19.07" />
          <line x1="2" x2="4" y1="12" y2="12" />
          <line x1="20" x2="22" y1="12" y2="12" />
          <line x1="4.93" x2="6.34" y1="19.07" y2="17.66" />
          <line x1="17.66" x2="19.07" y1="6.34" y2="4.93" />
        </motion.g>
      </motion.svg>
    );
  }
);

Sun.displayName = 'Sun';
export const SunIcon = Sun;
