import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const sweepVariants: Variants = {
  normal: { x: 0, y: 0, rotate: 0 },
  animate: {
    x: [0, 2.5, -1.5, 0],
    y: [0, -2, 1.5, 0],
    rotate: [0, 4, -3, 0],
    transition: { duration: 0.65, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0, rotate: 0 },
};

export const Search = forwardRef<SVGSVGElement, IconProps>(
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
          variants={sweepVariants}
          style={{ transformOrigin: '11px 11px' }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </motion.g>
      </motion.svg>
    );
  }
);

Search.displayName = 'Search';
export const SearchIcon = Search;
