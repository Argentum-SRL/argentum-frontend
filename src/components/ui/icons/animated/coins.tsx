import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const coin1: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -3, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

const coin2: Variants = {
  normal: { x: 0, y: 0 },
  animate: {
    x: [0, 2, 0],
    y: [0, -1, 0],
    transition: { duration: 0.45, delay: 0.08, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0 },
};

export const Coins = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.circle
          cx="8"
          cy="8"
          r="6"
          animate={controls}
          variants={coin1}
        />
        <motion.path
          d="M18.09 10.37A6 6 0 1 1 10.34 18"
          animate={controls}
          variants={coin2}
        />
        <path d="M7 6h1v4" />
        <path d="m16.71 13.88.7.71-2.82 2.82" />
      </motion.svg>
    );
  }
);

Coins.displayName = 'Coins';
export const CoinsIcon = Coins;
