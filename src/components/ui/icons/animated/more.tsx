import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const dot1: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2.5, 0],
    transition: { duration: 0.35, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

const dot2: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2.5, 0],
    transition: { duration: 0.35, delay: 0.08, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

const dot3: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2.5, 0],
    transition: { duration: 0.35, delay: 0.16, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

export const MoreHorizontal = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.circle cx="12" cy="12" r="1" animate={controls} variants={dot1} />
        <motion.circle cx="19" cy="12" r="1" animate={controls} variants={dot2} />
        <motion.circle cx="5" cy="12" r="1" animate={controls} variants={dot3} />
      </motion.svg>
    );
  }
);

MoreHorizontal.displayName = 'MoreHorizontal';
export const MoreHorizontalIcon = MoreHorizontal;

export const MoreVertical = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.circle cx="12" cy="12" r="1" animate={controls} variants={dot1} />
        <motion.circle cx="12" cy="5" r="1" animate={controls} variants={dot2} />
        <motion.circle cx="12" cy="19" r="1" animate={controls} variants={dot3} />
      </motion.svg>
    );
  }
);

MoreVertical.displayName = 'MoreVertical';
export const MoreVerticalIcon = MoreVertical;
