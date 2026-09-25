import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import { useEffect,  forwardRef, useCallback, useImperativeHandle, useRef  } from "react";
import { cn } from "@/lib/utils";

export interface AlertTriangleIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AlertTriangleIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number | string;
  strokeWidth?: number | string;
  isHovered?: boolean;
}

const TRIANGLE_VARIANTS: Variants = {
  normal: { rotate: 0, scale: 1 },
  animate: {
    rotate: [0, -12, 12, -6, 6, 0],
    scale: [1, 1.15, 1.05, 1.1, 1],
    transition: { duration: 0.55, ease: "easeInOut" },
  },
};

const MARK_VARIANTS: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2, 2, -1, 0],
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

const AlertTriangleIcon = forwardRef<AlertTriangleIconHandle, AlertTriangleIconProps>(
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
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          style={{ transformOrigin: "12px 14px" }}
          variants={TRIANGLE_VARIANTS}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <motion.line
            animate={controls}
            variants={MARK_VARIANTS}
            x1="12"
            x2="12"
            y1="9"
            y2="13"
          />
          <line x1="12" x2="12.01" y1="17" y2="17" />
        </motion.svg>
      </div>
    );
  }
);

AlertTriangleIcon.displayName = "AlertTriangleIcon";

export { AlertTriangleIcon, AlertTriangleIcon as AlertTriangle };
