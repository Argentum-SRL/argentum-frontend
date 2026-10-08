import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const shackleVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -3.5, 0],
    transition: { duration: 0.45, ease: EASINGS.mechanical },
  },
  reduced: { y: 0 },
};

export const Lock = forwardRef<SVGSVGElement, IconProps>(
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
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <motion.path
          d="M7 11V7a5 5 0 0 1 10 0v4"
          animate={controls}
          variants={shackleVariants}
        />
      </motion.svg>
    );
  }
);

Lock.displayName = 'Lock';
export const LockIcon = Lock;
