import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const cardVariants: Variants = {
  normal: { x: 0, rotate: 0 },
  animate: {
    x: [0, -3, 1, 0],
    rotate: [0, -2, 1, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { x: 0, rotate: 0 },
};

const stripeVariants: Variants = {
  normal: { opacity: 0.8 },
  animate: {
    opacity: [0.8, 1, 0.8],
    transition: { duration: 0.5 },
  },
  reduced: { opacity: 0.8 },
};

export const CreditCard = forwardRef<SVGSVGElement, IconProps>(
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
          variants={cardVariants}
          style={{ transformOrigin: '12px 12px' }}
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <motion.line
            x1="2"
            x2="22"
            y1="10"
            y2="10"
            variants={stripeVariants}
          />
        </motion.g>
      </motion.svg>
    );
  }
);

CreditCard.displayName = 'CreditCard';
export const CreditCardIcon = CreditCard;
