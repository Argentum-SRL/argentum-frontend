import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const playVariants: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, 2.5, 0],
    transition: { duration: 0.35, ease: EASINGS.argentum },
  },
  reduced: { x: 0 },
};

const pauseBar1: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2, 0],
    transition: { duration: 0.35, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

const pauseBar2: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, 2, 0],
    transition: { duration: 0.35, delay: 0.05, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

export const Play = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.polygon
          points="6 3 20 12 6 21 6 3"
          animate={controls}
          variants={playVariants}
        />
      </motion.svg>
    );
  }
);

Play.displayName = 'Play';
export const PlayIcon = Play;

export const Pause = forwardRef<SVGSVGElement, IconProps>(
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
        <motion.line x1="10" x2="10" y1="4" y2="20" animate={controls} variants={pauseBar1} />
        <motion.line x1="14" x2="14" y1="4" y2="20" animate={controls} variants={pauseBar2} />
      </motion.svg>
    );
  }
);

Pause.displayName = 'Pause';
export const PauseIcon = Pause;

export const PlayCircle = forwardRef<SVGSVGElement, IconProps>(
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
        <circle cx="12" cy="12" r="10" />
        <motion.polygon
          points="10 8 16 12 10 16 10 8"
          animate={controls}
          variants={playVariants}
        />
      </motion.svg>
    );
  }
);

PlayCircle.displayName = 'PlayCircle';
export const PlayCircleIcon = PlayCircle;

export const PauseCircle = forwardRef<SVGSVGElement, IconProps>(
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
        <circle cx="12" cy="12" r="10" />
        <motion.line x1="10" x2="10" y1="15" y2="9" animate={controls} variants={pauseBar1} />
        <motion.line x1="14" x2="14" y1="15" y2="9" animate={controls} variants={pauseBar2} />
      </motion.svg>
    );
  }
);

PauseCircle.displayName = 'PauseCircle';
export const PauseCircleIcon = PauseCircle;
