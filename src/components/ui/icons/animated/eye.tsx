import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const irisVariants: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.25, 0.9, 1],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { scale: 1 },
};

const lidVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, 1.5, -0.5, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

export const Eye = forwardRef<SVGSVGElement, IconProps>(
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
          d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
          animate={controls}
          variants={lidVariants}
        />
        <motion.circle
          cx="12"
          cy="12"
          r="3"
          animate={controls}
          variants={irisVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
      </motion.svg>
    );
  }
);

Eye.displayName = 'Eye';
export const EyeIcon = Eye;
