import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const lidVariants: Variants = {
  normal: { y: 0, rotate: 0 },
  animate: {
    y: [0, -3.5, 0],
    rotate: [0, -12, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { y: 0, rotate: 0 },
};

export const Trash2 = forwardRef<SVGSVGElement, IconProps>(
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
        {/* Animated Lid and Handle */}
        <motion.g
          animate={controls}
          variants={lidVariants}
          style={{ transformOrigin: '4px 6px' }}
        >
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <path d="M3 6h18" />
        </motion.g>
        {/* Stable Bin Body */}
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <line x1="10" x2="10" y1="11" y2="17" />
        <line x1="14" x2="14" y1="11" y2="17" />
      </motion.svg>
    );
  }
);

Trash2.displayName = 'Trash2';
export const Trash2Icon = Trash2;
export const Trash = Trash2;
export const TrashIcon = Trash2;
