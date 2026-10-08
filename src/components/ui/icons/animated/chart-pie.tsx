import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const sliceVariants: Variants = {
  normal: { x: 0, y: 0 },
  animate: {
    x: [0, 2.5, 0],
    y: [0, -2.5, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0 },
};

export const ChartPie = forwardRef<SVGSVGElement, IconProps>(
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
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <motion.path
          d="M22 12A10 10 0 0 0 12 2v10z"
          animate={controls}
          variants={sliceVariants}
        />
      </motion.svg>
    );
  }
);

ChartPie.displayName = 'ChartPie';
export const ChartPieIcon = ChartPie;
export const PieChart = ChartPie;
export const PieChartIcon = ChartPie;
