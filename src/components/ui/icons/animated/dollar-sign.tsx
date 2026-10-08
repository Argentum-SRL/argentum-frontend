import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const stemVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2, 2, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

const sVariants: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.12, 0.95, 1],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { scale: 1 },
};

export const DollarSign = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.line
          x1="12"
          x2="12"
          y1="2"
          y2="22"
          animate={controls}
          variants={stemVariants}
        />
        <motion.path
          d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
          animate={controls}
          variants={sVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
      </motion.svg>
    );
  }
);

DollarSign.displayName = 'DollarSign';
export const DollarSignIcon = DollarSign;
