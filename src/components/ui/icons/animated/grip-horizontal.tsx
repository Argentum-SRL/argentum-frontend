import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const dotsVariants: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, 2, -2, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

export const GripHorizontal = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.g animate={controls} variants={dotsVariants}>
          <circle cx="12" cy="9" r="1" />
          <circle cx="19" cy="9" r="1" />
          <circle cx="5" cy="9" r="1" />
          <circle cx="12" cy="15" r="1" />
          <circle cx="19" cy="15" r="1" />
          <circle cx="5" cy="15" r="1" />
        </motion.g>
      </motion.svg>
    );
  }
);

GripHorizontal.displayName = 'GripHorizontal';
export const GripHorizontalIcon = GripHorizontal;
