import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const dotVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2.5, 0],
    transition: { duration: 0.4, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

export const Info = forwardRef<SVGSVGElement, IconProps>(
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
          x2="12.01"
          y1="8"
          y2="8"
          animate={controls}
          variants={dotVariants}
        />
        <line x1="12" x2="12" y1="12" y2="16" />
      </motion.svg>
    );
  }
);

Info.displayName = 'Info';
export const InfoIcon = Info;
