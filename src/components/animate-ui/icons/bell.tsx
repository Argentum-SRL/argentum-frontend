
import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import { useEffect,  forwardRef, useCallback, useImperativeHandle, useRef  } from "react";

import { cn } from "@/lib/utils";

export interface BellIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BellIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number | string;
  strokeWidth?: number | string;
  isHovered?: boolean;
}

const SVG_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: [0, -10, 10, -10, 0] },
};

const BellIcon = forwardRef<BellIconHandle, BellIconProps>(
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
        className={cn("inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-200 hover:scale-115", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
          variants={SVG_VARIANTS}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </motion.svg>
      </div>
    );
  }
);

BellIcon.displayName = "BellIcon";

export { BellIcon, BellIcon as Bell };
