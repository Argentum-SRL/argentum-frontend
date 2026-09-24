
import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import { useEffect,  forwardRef, useCallback, useImperativeHandle, useRef  } from "react";

import { cn } from "@/lib/utils";

export interface CreditCardIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CreditCardIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number | string;
  strokeWidth?: number | string;
  isHovered?: boolean;
}

const CARD_VARIANTS: Variants = {
  normal: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 18,
    },
  },
  animate: {
    x: [0, -4, 1.5, 0],
    transition: {
      duration: 0.7,
      times: [0, 0.4, 0.75, 1],
      ease: "easeInOut",
    },
  },
};

const CreditCardIcon = forwardRef<CreditCardIconHandle, CreditCardIconProps>(
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
        className={cn("inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-200 hover:scale-110", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          className="overflow-visible"
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
          <motion.g
            animate={controls}
            initial="normal"
            variants={CARD_VARIANTS}
          >
            <rect height="14" rx="2" width="20" x="2" y="5" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </motion.g>
        </svg>
      </div>
    );
  }
);

CreditCardIcon.displayName = "CreditCardIcon";

export { CreditCardIcon, CreditCardIcon as CreditCard };
