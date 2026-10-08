import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const bubbleVariants: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.08, 0.96, 1],
    transition: { duration: 0.45, ease: EASINGS.gentle },
  },
  reduced: { scale: 1 },
};

export const MessageSquare = forwardRef<SVGSVGElement, IconProps>(
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
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          animate={controls}
          variants={bubbleVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
      </motion.svg>
    );
  }
);

MessageSquare.displayName = 'MessageSquare';
export const MessageSquareIcon = MessageSquare;

export const MessageCircle = forwardRef<SVGSVGElement, IconProps>(
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
          d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"
          animate={controls}
          variants={bubbleVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
      </motion.svg>
    );
  }
);

MessageCircle.displayName = 'MessageCircle';
export const MessageCircleIcon = MessageCircle;

export const MessageSquareOff = forwardRef<SVGSVGElement, IconProps>(
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
        <path d="M21 15V5a2 2 0 0 0-2-2H9" />
        <motion.path
          d="m2 2 20 20"
          animate={controls}
          variants={{
            normal: { pathLength: 1 },
            animate: { pathLength: [0, 1], transition: { duration: 0.45, ease: EASINGS.argentum } },
            reduced: { pathLength: 1 },
          }}
        />
        <path d="M3.6 3.6c-.4.3-.6.8-.6 1.4v16l4-4h10" />
      </motion.svg>
    );
  }
);

MessageSquareOff.displayName = 'MessageSquareOff';
export const MessageSquareOffIcon = MessageSquareOff;
