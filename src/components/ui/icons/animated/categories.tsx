import { forwardRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { useParentHover, mergeRefs } from '../core/use-parent-hover';
import type { IconProps } from '../core/types';
import { EASINGS } from '../motion/easings';

const tiltVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, -12, 12, 0],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { rotate: 0 },
};

export const Dumbbell = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, isHovered, ...props }, ref) => {
    const { svgRef, controls, handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd } =
      useParentHover({ isHovered });

    return (
      <motion.svg
        ref={mergeRefs(svgRef, ref)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        <motion.g
          animate={controls}
          variants={tiltVariants}
          style={{ transformOrigin: '12px 12px' }}
        >
          <path d="m6.5 6.5 11 11" />
          <path d="m21 21-1-1" />
          <path d="m3 3 1 1" />
          <path d="m18 22 4-4" />
          <path d="m2 6 4-4" />
          <path d="m3 10 7-7" />
          <path d="m14 21 7-7" />
        </motion.g>
      </motion.svg>
    );
  }
);
Dumbbell.displayName = 'Dumbbell';
export const DumbbellIcon = Dumbbell;

const heartPulseVariants: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.15, 0.95, 1.08, 1],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { scale: 1 },
};

export const HeartPulse = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, isHovered, ...props }, ref) => {
    const { svgRef, controls, handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd } =
      useParentHover({ isHovered });

    return (
      <motion.svg
        ref={mergeRefs(svgRef, ref)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        <motion.path
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          animate={controls}
          variants={heartPulseVariants}
          style={{ transformOrigin: '12px 12px' }}
        />
        <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
      </motion.svg>
    );
  }
);
HeartPulse.displayName = 'HeartPulse';
export const HeartPulseIcon = HeartPulse;

const phoneRingVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, -10, 10, -8, 8, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { rotate: 0 },
};

export const Smartphone = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, isHovered, ...props }, ref) => {
    const { svgRef, controls, handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd } =
      useParentHover({ isHovered });

    return (
      <motion.svg
        ref={mergeRefs(svgRef, ref)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        <motion.g
          animate={controls}
          variants={phoneRingVariants}
          style={{ transformOrigin: '12px 12px' }}
        >
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </motion.g>
      </motion.svg>
    );
  }
);
Smartphone.displayName = 'Smartphone';
export const SmartphoneIcon = Smartphone;

const capFloatVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -2.5, 0],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { y: 0 },
};

export const GraduationCap = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, isHovered, ...props }, ref) => {
    const { svgRef, controls, handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd } =
      useParentHover({ isHovered });

    return (
      <motion.svg
        ref={mergeRefs(svgRef, ref)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        <motion.path
          d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
          animate={controls}
          variants={capFloatVariants}
        />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </motion.svg>
    );
  }
);
GraduationCap.displayName = 'GraduationCap';
export const GraduationCapIcon = GraduationCap;

const beamOscillate: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, -10, 10, -5, 5, 0],
    transition: { duration: 0.65, ease: 'easeInOut' },
  },
  reduced: { rotate: 0 },
};

export const Scale = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, isHovered, ...props }, ref) => {
    const { svgRef, controls, handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd } =
      useParentHover({ isHovered });

    return (
      <motion.svg
        ref={mergeRefs(svgRef, ref)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <motion.path
          d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"
          animate={controls}
          variants={beamOscillate}
          style={{ transformOrigin: '12px 5px' }}
        />
      </motion.svg>
    );
  }
);
Scale.displayName = 'Scale';
export const ScaleIcon = Scale;

const sheetCellsVariants: Variants = {
  normal: { opacity: 1, scale: 1 },
  animate: {
    opacity: [1, 0.4, 1],
    scale: [1, 1.08, 1],
    transition: { duration: 0.45, ease: EASINGS.argentum },
  },
  reduced: { opacity: 1, scale: 1 },
};

export const FileSpreadsheet = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, isHovered, ...props }, ref) => {
    const { svgRef, controls, handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd } =
      useParentHover({ isHovered });

    return (
      <motion.svg
        ref={mergeRefs(svgRef, ref)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <motion.path
          d="M8 13h2M14 13h2M8 17h2M14 17h2"
          animate={controls}
          variants={sheetCellsVariants}
        />
      </motion.svg>
    );
  }
);
FileSpreadsheet.displayName = 'FileSpreadsheet';
export const FileSpreadsheetIcon = FileSpreadsheet;

const wifiWaveVariants: Variants = {
  normal: { opacity: 1, scale: 1 },
  animate: {
    opacity: [1, 0.3, 1],
    scale: [1, 1.1, 1],
    transition: { duration: 0.5, ease: EASINGS.argentum },
  },
  reduced: { opacity: 1, scale: 1 },
};

export const Wifi = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, isHovered, ...props }, ref) => {
    const { svgRef, controls, handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd } =
      useParentHover({ isHovered });

    return (
      <motion.svg
        ref={mergeRefs(svgRef, ref)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        <motion.path
          d="M12 20h.01"
          animate={controls}
          variants={wifiWaveVariants}
        />
        <motion.path
          d="M8.5 16.429a5 5 0 0 1 7 0"
          animate={controls}
          variants={wifiWaveVariants}
          style={{ transformOrigin: '12px 18px' }}
        />
        <motion.path
          d="M5 12.859a10 10 0 0 1 14 0"
          animate={controls}
          variants={wifiWaveVariants}
          style={{ transformOrigin: '12px 18px' }}
        />
        <motion.path
          d="M1.42 9.289a15 15 0 0 1 21.16 0"
          animate={controls}
          variants={wifiWaveVariants}
          style={{ transformOrigin: '12px 18px' }}
        />
      </motion.svg>
    );
  }
);
Wifi.displayName = 'Wifi';
export const WifiIcon = Wifi;
