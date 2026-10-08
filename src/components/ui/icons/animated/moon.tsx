import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const moonVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, -14, 8, -4, 0],
    transition: { duration: 0.6, ease: EASINGS.argentum },
  },
  reduced: { rotate: 0 },
};

export const Moon = forwardRef<SVGSVGElement, IconProps>(
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
          d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
          animate={controls}
          variants={moonVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
      </motion.svg>
    );
  }
);

Moon.displayName = 'Moon';
export const MoonIcon = Moon;
