export const EASINGS = {
  argentum: [0.22, 1, 0.36, 1] as const,
  mechanical: [0.4, 0, 0.2, 1] as const,
  gentle: [0.25, 0.1, 0.25, 1] as const,
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
  },
  softSpring: {
    type: 'spring' as const,
    stiffness: 220,
    damping: 24,
  },
  snappySpring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 26,
  },
} as const;
