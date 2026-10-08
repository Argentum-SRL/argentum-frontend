import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const rotateVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, 90, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { rotate: 0 },
};

export const Plus = forwardRef<SVGSVGElement, IconProps>(
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
          variants={rotateVariants}
          style={{ transformOrigin: '12px 12px' }}
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </motion.g>
      </motion.svg>
    );
  }
);

Plus.displayName = 'Plus';
export const PlusIcon = Plus;
