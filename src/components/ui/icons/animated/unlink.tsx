import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const leftLink: Variants = {
  normal: { x: 0, y: 0 },
  animate: {
    x: [0, -2, 0],
    y: [0, 2, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0 },
};

const rightLink: Variants = {
  normal: { x: 0, y: 0 },
  animate: {
    x: [0, 2, 0],
    y: [0, -2, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { x: 0, y: 0 },
};

export const Unlink = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.path d="m18.84 12.25 1.72-1.71a4.83 4.83 0 0 0 0-6.83 4.83 4.83 0 0 0-6.83 0l-1.72 1.71" animate={controls} variants={rightLink} />
        <motion.path d="m5.17 11.75-1.71 1.71a4.83 4.83 0 0 0 0 6.83 4.83 4.83 0 0 0 6.83 0l1.71-1.71" animate={controls} variants={leftLink} />
        <line x1="2" x2="22" y1="2" y2="22" />
      </motion.svg>
    );
  }
);

Unlink.displayName = 'Unlink';
export const UnlinkIcon = Unlink;

export const Link = forwardRef<SVGSVGElement, IconProps>(
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
          d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
          animate={controls}
          variants={rightLink}
        />
        <motion.path
          d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
          animate={controls}
          variants={leftLink}
        />
      </motion.svg>
    );
  }
);

Link.displayName = 'Link';
export const LinkIcon = Link;
