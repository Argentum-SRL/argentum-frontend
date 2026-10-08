import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const crossVariants: Variants = {
  normal: { rotate: 0, scale: 1 },
  animate: {
    rotate: [0, 90, 0],
    scale: [1, 0.9, 1.05, 1],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { rotate: 0, scale: 1 },
};

export const X = forwardRef<SVGSVGElement, IconProps>(
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
          variants={crossVariants}
          style={{ transformOrigin: '12px 12px' }}
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </motion.g>
      </motion.svg>
    );
  }
);

X.displayName = 'X';
export const XIcon = X;

export const CircleX = forwardRef<SVGSVGElement, IconProps>(
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
        <circle cx="12" cy="12" r="10" />
        <motion.g
          animate={controls}
          variants={crossVariants}
          style={{ transformOrigin: '12px 12px' }}
        >
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </motion.g>
      </motion.svg>
    );
  }
);

CircleX.displayName = 'CircleX';
export const CircleXIcon = CircleX;
export const XCircle = CircleX;
export const XCircleIcon = CircleX;
