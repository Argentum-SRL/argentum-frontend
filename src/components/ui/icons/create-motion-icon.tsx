import React, { forwardRef, useCallback, useEffect } from 'react';
import { motion, useAnimation, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';
import type { LucideIcon, LucideProps } from 'lucide-react';

export interface MotionIconProps extends LucideProps {
  isHovered?: boolean;
  animationType?: 'pulse' | 'wiggle' | 'spin' | 'bounce' | 'pop';
}

const VARIANTS_MAP: Record<string, Variants> = {
  pop: {
    normal: { scale: 1, rotate: 0, y: 0 },
    animate: {
      scale: [1, 1.22, 0.94, 1.08, 1],
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  },
  wiggle: {
    normal: { scale: 1, rotate: 0, y: 0 },
    animate: {
      scale: [1, 1.15, 1],
      rotate: [0, -14, 14, -7, 0],
      transition: { duration: 0.55, ease: 'easeInOut' },
    },
  },
  bounce: {
    normal: { scale: 1, y: 0 },
    animate: {
      y: [0, -4, 2, -1, 0],
      scale: [1, 1.12, 1],
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  },
  spin: {
    normal: { rotate: 0, scale: 1 },
    animate: {
      rotate: [0, 180, 360],
      scale: [1, 1.15, 1],
      transition: { duration: 0.65, ease: 'easeInOut' },
    },
  },
  pulse: {
    normal: { scale: 1 },
    animate: {
      scale: [1, 1.25, 0.92, 1.1, 1],
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  },
};

export function createMotionIcon(
  BaseIcon: LucideIcon,
  defaultAnimation: 'pulse' | 'wiggle' | 'spin' | 'bounce' | 'pop' = 'pop'
) {
  const Component = forwardRef<SVGSVGElement, MotionIconProps>(
    (
      {
        size = 24,
        strokeWidth = 2,
        className,
        isHovered,
        animationType = defaultAnimation,
        onMouseEnter,
        onMouseLeave,
        ...props
      },
      ref
    ) => {
      const controls = useAnimation();

      useEffect(() => {
        if (isHovered !== undefined) {
          if (isHovered) {
            controls.start('animate');
          } else {
            controls.start('normal');
          }
        }
      }, [isHovered, controls]);

      const handleMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          onMouseEnter?.(e as unknown as React.MouseEvent<SVGSVGElement>);
          controls.start('animate');
        },
        [controls, onMouseEnter]
      );

      const handleMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          onMouseLeave?.(e as unknown as React.MouseEvent<SVGSVGElement>);
          controls.start('normal');
        },
        [controls, onMouseLeave]
      );

      return (
        <div
          className={cn(
            'inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-200 hover:scale-115',
            className
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            animate={controls}
            variants={VARIANTS_MAP[animationType] || VARIANTS_MAP.pop}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <BaseIcon
              ref={ref}
              size={size}
              strokeWidth={strokeWidth}
              {...props}
            />
          </motion.div>
        </div>
      );
    }
  );

  Component.displayName = `Motion(${BaseIcon.displayName || 'Icon'})`;
  return Component;
}
