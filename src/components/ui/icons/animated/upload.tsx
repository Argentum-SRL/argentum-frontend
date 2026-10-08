import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const arrowVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -3.5, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

export const Upload = forwardRef<SVGSVGElement, IconProps>(
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
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <motion.g animate={controls} variants={arrowVariants}>
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </motion.g>
      </motion.svg>
    );
  }
);

Upload.displayName = 'Upload';
export const UploadIcon = Upload;
