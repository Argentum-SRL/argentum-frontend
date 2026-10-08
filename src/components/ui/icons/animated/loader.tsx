import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import type { IconProps } from '../core/types';

const spinVariants: Variants = {
  normal: { rotate: 360 },
  animate: {
    rotate: [0, 360],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  reduced: { rotate: 0 },
};

export const Loader2 = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => {
    return (
      <motion.svg
        ref={ref}
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
        animate="animate"
        variants={spinVariants}
        style={{ transformOrigin: '12px 12px' }}
        {...props}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </motion.svg>
    );
  }
);

Loader2.displayName = 'Loader2';
export const Loader2Icon = Loader2;
export const LoaderCircle = Loader2;
export const LoaderCircleIcon = Loader2;
