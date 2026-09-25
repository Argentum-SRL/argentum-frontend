import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { useEffect,  forwardRef, useCallback, useImperativeHandle, useRef  } from "react";

import { cn } from "@/lib/utils";

export interface ArrowDownLeftIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ArrowDownLeftIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number | string;
  isHovered?: boolean;
  strokeWidth?: number | string;
}

const HEAD_VARIANTS: Variants = {
  normal: { translateX: 0, translateY: 0 },
  animate: {
    translateX: [0, 3, 0],
    translateY: [0, -3, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

const SHAFT_VARIANTS: Variants = {
  normal: { translateX: 0, translateY: 0, scale: 1 },
  animate: {
    translateX: [0, 3, 0],
    translateY: [0, -3, 0],
    scale: [1, 0.85, 1],
    originX: 1,
    originY: 1,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

const ArrowDownLeftIcon = forwardRef<
  ArrowDownLeftIconHandle,
  ArrowDownLeftIconProps
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

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;
    return {
      startAnimation: () => controls.start("animate"),
      stopAnimation: () => controls.start("normal"),
    };
  });

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlledRef.current) controls.start("animate");
      onMouseEnter?.(e);
    },
    [controls, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isControlledRef.current) controls.start("normal");
      onMouseLeave?.(e);
    },
    [controls, onMouseLeave]
  );

  return (
    <div
      className={cn("transition-transform duration-200 hover:scale-115", Boolean(props.onClick) && "cursor-pointer", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <svg strokeWidth={strokeWidth} fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          animate={controls}
          d="M17 17H7V7"
          variants={HEAD_VARIANTS}
        />
        <motion.path
          animate={controls}
          d="M7 17 L12 12"
          variants={SHAFT_VARIANTS}
        />
        <path d="M17 7 L12 12" />
      </svg>
    </div>
  );
});

ArrowDownLeftIcon.displayName = "ArrowDownLeftIcon";

export { ArrowDownLeftIcon, ArrowDownLeftIcon as ArrowDownLeft };