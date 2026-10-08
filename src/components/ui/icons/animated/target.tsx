import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const ringOuter: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.08, 1],
    transition: { duration: 0.45, ease: EASINGS.gentle },
  },
  reduced: { scale: 1 },
};

const ringMid: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 0.94, 1.04, 1],
    transition: { duration: 0.5, delay: 0.05, ease: EASINGS.gentle },
  },
  reduced: { scale: 1 },
};

const ringInner: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.5, delay: 0.1, ease: EASINGS.gentle },
  },
  reduced: { scale: 1 },
};

export const Target = forwardRef<SVGSVGElement, IconProps>(
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
          variants={ringOuter}
          style={{ transformOrigin: '12px 12px' }}
        />
        <motion.circle
          cx="12"
          cy="12"
          r="6"
          animate={controls}
          variants={ringMid}
          style={{ transformOrigin: '12px 12px' }}
        />
        <motion.circle
          cx="12"
          cy="12"
          r="2"
          animate={controls}
          variants={ringInner}
          style={{ transformOrigin: '12px 12px' }}
        />
      </motion.svg>
    );
  }
);

Target.displayName = 'Target';
export const TargetIcon = Target;
