import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const buttonsVariants: Variants = {
  normal: { opacity: 1, scale: 1 },
  animate: {
    opacity: [1, 0.5, 1],
    scale: [1, 1.15, 1],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { opacity: 1, scale: 1 },
};

export const Calculator = forwardRef<SVGSVGElement, IconProps>(
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
        <rect width="16" height="20" x="4" y="2" rx="2" />
        <line x1="8" x2="16" y1="6" y2="6" />
        <motion.g animate={controls} variants={buttonsVariants}>
          <line x1="16" x2="16.01" y1="14" y2="14" />
          <line x1="16" x2="16.01" y1="18" y2="18" />
          <line x1="12" x2="12.01" y1="10" y2="10" />
          <line x1="12" x2="12.01" y1="14" y2="14" />
          <line x1="12" x2="12.01" y1="18" y2="18" />
          <line x1="8" x2="8.01" y1="10" y2="10" />
          <line x1="8" x2="8.01" y1="14" y2="14" />
          <line x1="8" x2="8.01" y1="18" y2="18" />
        </motion.g>
      </motion.svg>
    );
  }
);

Calculator.displayName = 'Calculator';
export const CalculatorIcon = Calculator;
