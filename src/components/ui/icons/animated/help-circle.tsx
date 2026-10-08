import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const markVariants: Variants = {
  normal: { y: 0, rotate: 0 },
  animate: {
    y: [0, -2, 0],
    rotate: [0, 8, -4, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { y: 0, rotate: 0 },
};

export const HelpCircle = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.path
          d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
          animate={controls}
          variants={markVariants}
          style={{ transformOrigin: '12px 11px' }}
        />
        <line x1="12" x2="12.01" y1="17" y2="17" />
      </motion.svg>
    );
  }
);

HelpCircle.displayName = 'HelpCircle';
export const HelpCircleIcon = HelpCircle;
export const CircleHelp = HelpCircle;
export const CircleHelpIcon = HelpCircle;
