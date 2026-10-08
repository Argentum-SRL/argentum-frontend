// ─────────────────────────────────────────────────────────────────────────────
// ARGENTUM ICON SYSTEM — SINGLE SOURCE OF TRUTH
// 100% SVG Vector-Sharp, Motion-Powered Internal Animations, Parent-Hover Aware
// ─────────────────────────────────────────────────────────────────────────────

import type React from 'react';
import type { IconProps } from './core/types';

// 1. Core Icon System Types and Hooks
export * from './core/types';
export * from './core/use-parent-hover';

// 2. Motion System: Easings and Signatures
export * from './motion/easings';
export * from './motion/signatures';

// 3. Motion Primitives
export * from './primitives';

// 4. High-Definition Animated Icons (Comprehensive 100% coverage of Argentum)
export * from './animated';

// 5. Semantic Financial Aliases
export * from './semantic';

// 6. External Lucide Type Definitions for seamless backward compatibility
export type LucideProps = IconProps;
export type LucideIcon = React.ComponentType<IconProps>;

