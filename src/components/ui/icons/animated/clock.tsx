import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const minuteHandVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: 180,
    transition: { duration: 0.6, ease: EASINGS.mechanical },
  },
  reduced: { rotate: 0 },
};

const hourHandVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: 30,
    transition: { duration: 0.6, ease: EASINGS.mechanical },
  },
  reduced: { rotate: 0 },
};

export const Clock = forwardRef<SVGSVGElement, IconProps>(
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
        <circle cx="12" cy="12" r="10" />
        <motion.line
          x1="12"
          x2="12"
          y1="12"
          y2="6"
          animate={controls}
          variants={minuteHandVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
        <motion.line
          x1="12"
          x2="16"
          y1="12"
          y2="14"
          animate={controls}
          variants={hourHandVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
      </motion.svg>
    );
  }
);

Clock.displayName = 'Clock';
export const ClockIcon = Clock;
