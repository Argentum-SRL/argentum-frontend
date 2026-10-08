import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const checkVariants: Variants = {
  normal: { pathLength: 1, opacity: 1 },
  animate: {
    pathLength: [0, 1],
    opacity: 1,
    transition: { duration: 0.35, delay: 0.08, ease: EASINGS.argentum },
  },
  reduced: { pathLength: 1, opacity: 1 },
};

const circleVariants: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.35, ease: EASINGS.gentle },
  },
  reduced: { scale: 1 },
};

export const CircleCheck = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          animate={controls}
          variants={circleVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
        <motion.path
          d="m9 12 2 2 4-4"
          animate={controls}
          variants={checkVariants}
        />
      </motion.svg>
    );
  }
);

CircleCheck.displayName = 'CircleCheck';
export const CircleCheckIcon = CircleCheck;
export const CheckCircle = CircleCheck;
export const CheckCircleIcon = CircleCheck;
export const CheckCircle2 = CircleCheck;
export const CheckCircle2Icon = CircleCheck;
