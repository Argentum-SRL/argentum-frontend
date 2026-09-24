import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import { useEffect,  forwardRef, useCallback, useImperativeHandle, useRef  } from "react";
import { cn } from "@/lib/utils";

export interface CalculatorIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CalculatorIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number | string;
  strokeWidth?: number | string;
  isHovered?: boolean;
}

const BODY_VARIANTS: Variants = {
  normal: { rotate: 0, scale: 1 },
  animate: {
    rotate: [0, -6, 6, -3, 0],
    scale: [1, 1.12, 1],
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

const CalculatorIcon = forwardRef<CalculatorIconHandle, CalculatorIconProps>(
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
          style={{ transformOrigin: "12px 12px" }}
          variants={BODY_VARIANTS}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect height="20" rx="2" width="16" x="4" y="2" />
          <line x1="8" x2="16" y1="6" y2="6" />
          <line x1="16" x2="16" y1="14" y2="18" />
          <path d="M16 10h.01" />
          <path d="M12 10h.01" />
          <path d="M8 10h.01" />
          <path d="M12 14h.01" />
          <path d="M8 14h.01" />
          <path d="M12 18h.01" />
          <path d="M8 18h.01" />
        </motion.svg>
      </div>
    );
  }
);

CalculatorIcon.displayName = "CalculatorIcon";

export { CalculatorIcon, CalculatorIcon as Calculator };
