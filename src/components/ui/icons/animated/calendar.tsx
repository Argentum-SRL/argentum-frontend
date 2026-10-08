import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const pinVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2, 0],
    transition: { duration: 0.35, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

const dateLinesVariants: Variants = {
  normal: { pathLength: 1, opacity: 1 },
  animate: {
    pathLength: [0, 1],
    opacity: 1,
    transition: { duration: 0.4, delay: 0.08, ease: EASINGS.argentum },
  },
  reduced: { pathLength: 1, opacity: 1 },
};

export const Calendar = forwardRef<SVGSVGElement, IconProps>(
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
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <motion.g animate={controls} variants={pinVariants}>
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
        </motion.g>
        <motion.line
          x1="3"
          x2="21"
          y1="10"
          y2="10"
          animate={controls}
          variants={dateLinesVariants}
        />
      </motion.svg>
    );
  }
);

Calendar.displayName = 'Calendar';
export const CalendarIcon = Calendar;
