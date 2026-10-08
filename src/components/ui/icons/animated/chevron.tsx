import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const nudgeLeft: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, -3, 0],
    transition: { duration: 0.35, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

const nudgeRight: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, 3, 0],
    transition: { duration: 0.35, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

const nudgeDown: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, 3, 0],
    transition: { duration: 0.35, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

const nudgeUp: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -3, 0],
    transition: { duration: 0.35, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

export const ChevronLeft = forwardRef<SVGSVGElement, IconProps>(
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
          d="m15 18-6-6 6-6"
          animate={controls}
          variants={nudgeLeft}
        />
      </motion.svg>
    );
  }
);

ChevronLeft.displayName = 'ChevronLeft';
export const ChevronLeftIcon = ChevronLeft;

export const ChevronRight = forwardRef<SVGSVGElement, IconProps>(
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
          d="m9 18 6-6-6-6"
          animate={controls}
          variants={nudgeRight}
        />
      </motion.svg>
    );
  }
);

ChevronRight.displayName = 'ChevronRight';
export const ChevronRightIcon = ChevronRight;

export const ChevronDown = forwardRef<SVGSVGElement, IconProps>(
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
          d="m6 9 6 6 6-6"
          animate={controls}
          variants={nudgeDown}
        />
      </motion.svg>
    );
  }
);

ChevronDown.displayName = 'ChevronDown';
export const ChevronDownIcon = ChevronDown;

export const ChevronUp = forwardRef<SVGSVGElement, IconProps>(
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
          d="m18 15-6-6-6 6"
          animate={controls}
          variants={nudgeUp}
        />
      </motion.svg>
    );
  }
);

ChevronUp.displayName = 'ChevronUp';
export const ChevronUpIcon = ChevronUp;
