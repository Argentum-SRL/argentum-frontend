import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const lineVariants: Variants = {
  normal: { scaleX: 1 },
  animate: {
    scaleX: [1, 0.65, 1.1, 1],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { scaleX: 1 },
};

export const Minus = forwardRef<SVGSVGElement, IconProps>(
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
          d="M5 12h14"
          animate={controls}
          variants={lineVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
      </motion.svg>
    );
  }
);

Minus.displayName = 'Minus';
export const MinusIcon = Minus;
