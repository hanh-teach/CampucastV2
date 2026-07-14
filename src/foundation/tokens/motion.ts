export const motion = {
  // Durations
  fast: "120ms",
  normal: "220ms",
  slow: "300ms",
  
  // Transitions & Bezier Curves (Springs / Eases)
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 25
  },
  easeOut: {
    ease: [0.16, 1, 0.3, 1], // easeOutExpo
    duration: 0.4
  },
  easeInOut: {
    ease: "easeInOut",
    duration: 0.25
  },
  
  // Animation micro-values for framer-motion / motion/react
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 }
  },
  scaleUp: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 }
  }
};
