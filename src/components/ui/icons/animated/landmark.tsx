import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const pillarsVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -1.5, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

export const Landmark = forwardRef<SVGSVGElement, IconProps>(
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
        <line x1="3" x2="21" y1="22" y2="22" />
        <line x1="6" x2="18" y1="18" y2="18" />
        <path d="m12 2 10 7H2z" />
        <motion.g animate={controls} variants={pillarsVariants}>
          <line x1="6" x2="6" y1="11" y2="18" />
          <line x1="10" x2="10" y1="11" y2="18" />
          <line x1="14" x2="14" y1="11" y2="18" />
          <line x1="18" x2="18" y1="11" y2="18" />
        </motion.g>
      </motion.svg>
    );
  }
);

Landmark.displayName = 'Landmark';
export const LandmarkIcon = Landmark;

export const Building2 = forwardRef<SVGSVGElement, IconProps>(
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
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M18 9h4a2 2 0 0 1 2 2v11" />
        <path d="M2 22V13a2 2 0 0 1 2-2h2" />
        <motion.path
          d="M10 6h4M10 10h4M10 14h4M10 18h4"
          animate={controls}
          variants={pillarsVariants}
        />
      </motion.svg>
    );
  }
);

Building2.displayName = 'Building2';
export const Building2Icon = Building2;
