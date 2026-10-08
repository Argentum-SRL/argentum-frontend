import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const exclamationVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2, 1, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

const circleVariants: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.45, ease: EASINGS.gentle },
  },
  reduced: { scale: 1 },
};

export const AlertCircle = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.g animate={controls} variants={exclamationVariants}>
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </motion.g>
      </motion.svg>
    );
  }
);

AlertCircle.displayName = 'AlertCircle';
export const AlertCircleIcon = AlertCircle;
export const CircleAlert = AlertCircle;
export const CircleAlertIcon = AlertCircle;
