import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const keyVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, 25, -10, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { rotate: 0 },
};

export const Key = forwardRef<SVGSVGElement, IconProps>(
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
          d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4M15.5 7.5 11 12m4.5-4.5a5 5 0 1 0-7 7l6.5-6.5"
          animate={controls}
          variants={keyVariants}
          style={{ transformOrigin: '7.5px 16.5px' }}
        />
      </motion.svg>
    );
  }
);

Key.displayName = 'Key';
export const KeyIcon = Key;
export const KeyRound = Key;
export const KeyRoundIcon = Key;
