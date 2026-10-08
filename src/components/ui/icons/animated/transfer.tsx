import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const topArrowVariants: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, 3, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

const bottomArrowVariants: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, -3, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

export const ArrowRightLeft = forwardRef<SVGSVGElement, IconProps>(
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
        {/* Top arrow (moving right) */}
        <motion.g animate={controls} variants={topArrowVariants}>
          <path d="m16 3 4 4-4 4" />
          <path d="M20 7H4" />
        </motion.g>
        {/* Bottom arrow (moving left) */}
        <motion.g animate={controls} variants={bottomArrowVariants}>
          <path d="m8 21-4-4 4-4" />
          <path d="M4 17h16" />
        </motion.g>
      </motion.svg>
    );
  }
);

ArrowRightLeft.displayName = 'ArrowRightLeft';
export const ArrowRightLeftIcon = ArrowRightLeft;
export const ArrowLeftRight = ArrowRightLeft;
export const ArrowLeftRightIcon = ArrowRightLeft;
export const Repeat = ArrowRightLeft;
export const RepeatIcon = ArrowRightLeft;
export const Transfer = ArrowRightLeft;
export const TransferIcon = ArrowRightLeft;
