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
      scale: [1, 1.14, 0.96, 1.05, 1],
      transition: { duration: 0.45, ease: 'easeOut' },
    },
  },
  wiggle: {
    normal: { scale: 1, rotate: 0, y: 0 },
    animate: {
      rotate: [0, -15, 15, -9, 9, -4, 0],
      scale: [1, 1.06, 1],
      transition: { duration: 0.55, ease: 'easeInOut' },
    },
  },
  bounce: {
    normal: { scale: 1, y: 0 },
    animate: {
      y: [0, -3.5, 1.5, -0.6, 0],
      transition: { duration: 0.45, ease: 'easeOut' },
    },
  },
  spin: {
    normal: { rotate: 0, scale: 1 },
    animate: {
      rotate: 360,
      scale: [1, 1.08, 1],
      transition: { duration: 0.6, ease: 'easeInOut' },
    },
  },
  pulse: {
    normal: { scale: 1 },
    animate: {
      scale: [1, 1.15, 0.95, 1.06, 1],
      transition: { duration: 0.45, ease: 'easeOut' },
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
            'inline-flex items-center justify-center select-none',
            Boolean((props as Record<string, unknown>).onClick) && 'cursor-pointer',
            className
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            animate={controls}
            variants={VARIANTS_MAP[animationType] || VARIANTS_MAP.pop}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transformOrigin: 'center center',
            }}
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
