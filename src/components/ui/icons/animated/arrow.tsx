import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const thrustLeft: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, -3.5, 0],
    transition: { duration: 0.4, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

const thrustRight: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, 3.5, 0],
    transition: { duration: 0.4, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

const thrustUpRight: Variants = {
  normal: { x: 0, y: 0 },
  animate: {
    x: [0, 2.5, 0],
    y: [0, -2.5, 0],
    transition: { duration: 0.4, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0 },
};

const thrustDownLeft: Variants = {
  normal: { x: 0, y: 0 },
  animate: {
    x: [0, -2.5, 0],
    y: [0, 2.5, 0],
    transition: { duration: 0.4, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0 },
};

export const ArrowLeft = forwardRef<SVGSVGElement, IconProps>(
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
          d="m12 19-7-7 7-7"
          animate={controls}
          variants={thrustLeft}
        />
        <motion.path
          d="M19 12H5"
          animate={controls}
          variants={thrustLeft}
        />
      </motion.svg>
    );
  }
);

ArrowLeft.displayName = 'ArrowLeft';
export const ArrowLeftIcon = ArrowLeft;

export const ArrowRight = forwardRef<SVGSVGElement, IconProps>(
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
          d="M5 12h14"
          animate={controls}
          variants={thrustRight}
        />
        <motion.path
          d="m12 5 7 7-7 7"
          animate={controls}
          variants={thrustRight}
        />
      </motion.svg>
    );
  }
);

ArrowRight.displayName = 'ArrowRight';
export const ArrowRightIcon = ArrowRight;

export const ArrowUpRight = forwardRef<SVGSVGElement, IconProps>(
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
          d="M7 7h10v10"
          animate={controls}
          variants={thrustUpRight}
        />
        <motion.path
          d="M7 17 17 7"
          animate={controls}
          variants={thrustUpRight}
        />
      </motion.svg>
    );
  }
);

ArrowUpRight.displayName = 'ArrowUpRight';
export const ArrowUpRightIcon = ArrowUpRight;

export const ArrowDownLeft = forwardRef<SVGSVGElement, IconProps>(
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
          d="M17 17H7V7"
          animate={controls}
          variants={thrustDownLeft}
        />
        <motion.path
          d="m17 7-10 10"
          animate={controls}
          variants={thrustDownLeft}
        />
      </motion.svg>
    );
  }
);

ArrowDownLeft.displayName = 'ArrowDownLeft';
export const ArrowDownLeftIcon = ArrowDownLeft;

export const ArrowUpDown = forwardRef<SVGSVGElement, IconProps>(
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
          variants={{
            normal: { y: 0 },
            animate: { y: [0, 3, 0], transition: { duration: 0.4, ease: EASINGS.argentum } },
            reduced: { y: 0 },
          }}
        >
          <path d="m21 16-4 4-4-4" />
          <path d="M17 20V4" />
        </motion.g>
        <motion.g
          animate={controls}
          variants={{
            normal: { y: 0 },
            animate: { y: [0, -3, 0], transition: { duration: 0.4, ease: EASINGS.argentum } },
            reduced: { y: 0 },
          }}
        >
          <path d="m3 8 4-4 4 4" />
          <path d="M7 4v16" />
        </motion.g>
      </motion.svg>
    );
  }
);

ArrowUpDown.displayName = 'ArrowUpDown';
export const ArrowUpDownIcon = ArrowUpDown;
