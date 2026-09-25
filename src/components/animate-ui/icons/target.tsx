import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import { useEffect,  forwardRef, useCallback, useImperativeHandle, useRef  } from "react";
import { cn } from "@/lib/utils";

export interface TargetIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface TargetIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number | string;
  strokeWidth?: number | string;
  isHovered?: boolean;
}

const OUTER_VARIANTS: Variants = {
  normal: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.15, 0.95, 1.05, 1],
    rotate: [0, -15, 15, -5, 0],
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

const INNER_VARIANTS: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 0.85, 1.2, 0.95, 1],
    transition: { duration: 0.55, ease: "easeInOut", delay: 0.05 },
  },
};

const CENTER_VARIANTS: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.6, 0.9, 1.2, 1],
    transition: { duration: 0.5, ease: "easeInOut", delay: 0.1 },
  },
};

const TargetIcon = forwardRef<TargetIconHandle, TargetIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 24, strokeWidth = 2, isHovered, ...props }, ref) => {
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
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div
        className={cn("inline-flex items-center justify-center select-none transition-transform duration-200 hover:scale-115", Boolean(props.onClick) && "cursor-pointer", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.circle
            animate={controls}
            cx="12"
            cy="12"
            r="10"
            style={{ transformOrigin: "12px 12px" }}
            variants={OUTER_VARIANTS}
          />
          <motion.circle
            animate={controls}
            cx="12"
            cy="12"
            r="6"
            style={{ transformOrigin: "12px 12px" }}
            variants={INNER_VARIANTS}
          />
          <motion.circle
            animate={controls}
            cx="12"
            cy="12"
            r="2"
            style={{ transformOrigin: "12px 12px" }}
            variants={CENTER_VARIANTS}
          />
        </svg>
      </div>
    );
  }
);

TargetIcon.displayName = "TargetIcon";

export { TargetIcon, TargetIcon as Target };
