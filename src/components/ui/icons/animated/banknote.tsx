import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const billVariants: Variants = {
  normal: { y: 0, rotate: 0 },
  animate: {
    y: [0, -2.5, 0],
    rotate: [0, -2, 2, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { y: 0, rotate: 0 },
};

const centerCircle: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.25, 1],
    transition: { duration: 0.5, ease: EASINGS.gentle },
  },
  reduced: { scale: 1 },
};

export const Banknote = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.g
          animate={controls}
          variants={billVariants}
          style={{ transformOrigin: '12px 12px' }}
        >
          <rect width="20" height="12" x="2" y="6" rx="2" />
          <motion.circle
            cx="12"
            cy="12"
            r="2"
            variants={centerCircle}
            style={{ transformOrigin: '12px 12px' }}
          />
          <path d="M6 12h.01M18 12h.01" />
        </motion.g>
      </motion.svg>
    );
  }
);

Banknote.displayName = 'Banknote';
export const BanknoteIcon = Banknote;
