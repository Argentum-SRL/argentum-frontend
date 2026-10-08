import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const frontSheetVariants: Variants = {
  normal: { x: 0, y: 0 },
  animate: {
    x: [0, 3, 0],
    y: [0, -3, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0 },
};

export const Copy = forwardRef<SVGSVGElement, IconProps>(
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
        {/* Base sheet */}
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        {/* Front sheet sliding out */}
        <motion.path
          d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
          animate={controls}
          variants={frontSheetVariants}
        />
      </motion.svg>
    );
  }
);

Copy.displayName = 'Copy';
export const CopyIcon = Copy;
