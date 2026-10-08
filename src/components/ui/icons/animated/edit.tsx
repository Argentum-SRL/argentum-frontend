import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const penVariants: Variants = {
  normal: { x: 0, y: 0, rotate: 0 },
  animate: {
    x: [0, 2, -1, 0],
    y: [0, -2, 1, 0],
    rotate: [0, -8, 4, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0, rotate: 0 },
};

export const Pencil = forwardRef<SVGSVGElement, IconProps>(
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
          d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
          animate={controls}
          variants={penVariants}
          style={{ transformOrigin: '4px 20px' }}
        />
      </motion.svg>
    );
  }
);

Pencil.displayName = 'Pencil';
export const PencilIcon = Pencil;
export const Edit = Pencil;
export const EditIcon = Pencil;
export const Edit2 = Pencil;
export const Edit2Icon = Pencil;
export const Edit3 = Pencil;
export const Edit3Icon = Pencil;
