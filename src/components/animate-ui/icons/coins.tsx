import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import { useEffect,  forwardRef, useCallback, useImperativeHandle, useRef  } from "react";
import { cn } from "@/lib/utils";

export interface CoinsIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CoinsIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number | string;
  strokeWidth?: number | string;
  isHovered?: boolean;
}

const COIN1_VARIANTS: Variants = {
  normal: { y: 0, rotate: 0, scale: 1 },
  animate: {
    y: [0, -3, 0],
    rotate: [0, -8, 8, 0],
    scale: [1, 1.1, 1],
    transition: { duration: 0.55, ease: "easeInOut" },
  },
};

const COIN2_VARIANTS: Variants = {
  normal: { y: 0, rotate: 0, scale: 1 },
  animate: {
    y: [0, -4, 0],
    rotate: [0, 10, -10, 0],
    scale: [1, 1.12, 1],
    transition: { duration: 0.6, ease: "easeInOut", delay: 0.05 },
  },
};

const CoinsIcon = forwardRef<CoinsIconHandle, CoinsIconProps>(
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
            cx="8"
            cy="8"
            r="6"
            style={{ transformOrigin: "8px 8px" }}
            variants={COIN1_VARIANTS}
          />
          <motion.path
            animate={controls}
            d="M18.09 10.37A6 6 0 1 1 10.34 18"
            style={{ transformOrigin: "14px 14px" }}
            variants={COIN2_VARIANTS}
          />
          <motion.path
            animate={controls}
            d="M7 6h1v4"
            style={{ transformOrigin: "8px 8px" }}
            variants={COIN1_VARIANTS}
          />
          <motion.path
            animate={controls}
            d="m16.71 13.88.7.71-2.82 2.82"
            style={{ transformOrigin: "14px 14px" }}
            variants={COIN2_VARIANTS}
          />
        </svg>
      </div>
    );
  }
);

CoinsIcon.displayName = "CoinsIcon";

export { CoinsIcon, CoinsIcon as Coins };
