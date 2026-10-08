import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const sliderTop: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, 4, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

const sliderMid: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, -4, 0],
    transition: { duration: 0.5, delay: 0.05, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

const sliderBottom: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, 3, 0],
    transition: { duration: 0.5, delay: 0.1, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

export const SlidersHorizontal = forwardRef<SVGSVGElement, IconProps>(
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
        <line x1="21" x2="14" y1="4" y2="4" />
        <line x1="10" x2="3" y1="4" y2="4" />
        <motion.line
          x1="14"
          x2="14"
          y1="1"
          y2="7"
          animate={controls}
          variants={sliderTop}
        />
        <line x1="21" x2="12" y1="12" y2="12" />
        <line x1="8" x2="3" y1="12" y2="12" />
        <motion.line
          x1="8"
          x2="8"
          y1="9"
          y2="15"
          animate={controls}
          variants={sliderMid}
        />
        <line x1="21" x2="16" y1="20" y2="20" />
        <line x1="12" x2="3" y1="20" y2="20" />
        <motion.line
          x1="16"
          x2="16"
          y1="17"
          y2="23"
          animate={controls}
          variants={sliderBottom}
        />
      </motion.svg>
    );
  }
);

SlidersHorizontal.displayName = 'SlidersHorizontal';
export const SlidersHorizontalIcon = SlidersHorizontal;

const funnelVariants: Variants = {
  normal: { y: 0, scale: 1 },
  animate: {
    y: [0, 2, 0],
    scale: [1, 0.96, 1],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { y: 0, scale: 1 },
};

export const Filter = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.polygon
          points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
          animate={controls}
          variants={funnelVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
      </motion.svg>
    );
  }
);

Filter.displayName = 'Filter';
export const FilterIcon = Filter;
