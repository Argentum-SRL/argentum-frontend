import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { useEffect,  forwardRef, useCallback, useImperativeHandle, useRef  } from "react";

import { cn } from "@/lib/utils";

export interface GripHorizontalIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface GripHorizontalIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number | string;
  isHovered?: boolean;
  strokeWidth?: number | string;
}

const CIRCLES = [
  { cx: 5, cy: 9 },
  { cx: 12, cy: 9 },
  { cx: 19, cy: 9 },
  { cx: 5, cy: 15 },
  { cx: 12, cy: 15 },
  { cx: 19, cy: 15 },
];

const VARIANTS: Variants = {
  normal: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  animate: (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;

    const delay = col * 0.15 + row * 0.25;

    return {
      opacity: [1, 0.4, 1],
      scale: [1, 0.85, 1],
      transition: {
        delay,
        duration: 1,
        ease: "easeInOut",
      },
    };
  },
};

const GripHorizontalIcon = forwardRef<
  GripHorizontalIconHandle,
  GripHorizontalIconProps
>(({ onMouseEnter, onMouseLeave, className, size = 24, strokeWidth = 2, isHovered, ...props }, ref) => {
  const controls = useAnimation();

    useEffect(() => {
      if (isHovered !== undefined) {
        if (isHovered) {
          controls.start("animate");
        } else {
          controls.start("normal");
        }
      }
    }, [isHovered, controls]);
  const isControlledRef = useRef(false);
  const isAnimatingRef = useRef(false);

  const startAnimation = useCallback(async () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    await controls.start("animate");
    await controls.start("normal");
    isAnimatingRef.current = false;
  }, [controls]);

  const stopAnimation = useCallback(async () => {
    if (!isAnimatingRef.current) return;
    await controls.start("normal");
    isAnimatingRef.current = false;
  }, [controls]);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;
    return { startAnimation, stopAnimation };
  });

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlledRef.current) startAnimation();
      onMouseEnter?.(e);
    },
    [startAnimation, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlledRef.current) stopAnimation();
      onMouseLeave?.(e);
    },
    [stopAnimation, onMouseLeave]
  );

  return (
    <div
      className={cn("transition-transform duration-200 hover:scale-115", "inline-flex items-center justify-center", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <svg
        strokeWidth={strokeWidth} fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        {CIRCLES.map((circle, index) => (
          <motion.circle
            animate={controls}
            custom={index}
            cx={circle.cx}
            cy={circle.cy}
            initial="normal"
            key={`${circle.cx}-${circle.cy}`}
            r="1"
            variants={VARIANTS}
          />
        ))}
      </svg>
    </div>
  );
});

GripHorizontalIcon.displayName = "GripHorizontalIcon";

export { GripHorizontalIcon, GripHorizontalIcon as GripHorizontal };