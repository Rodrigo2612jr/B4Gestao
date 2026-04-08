"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

type AnimationType = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "fade" | "scale" | "blur" | "slide-up";

// Map old direction API to new animation types for backwards compat
type Direction = "up" | "down" | "left" | "right" | "none";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "span" | "p";
  /** Legacy API — use `animation` for more options */
  direction?: Direction;
  /** New animation types with more variety */
  animation?: AnimationType;
  delay?: number;
  duration?: number;
}

const directionToAnimation: Record<Direction, AnimationType> = {
  up: "fade-up",
  down: "fade-down",
  left: "fade-left",
  right: "fade-right",
  none: "fade",
};

const hiddenVariants: Record<AnimationType, Record<string, number | string>> = {
  "fade-up": { opacity: 0, y: 40 },
  "fade-down": { opacity: 0, y: -40 },
  "fade-left": { opacity: 0, x: -50 },
  "fade-right": { opacity: 0, x: 50 },
  "fade": { opacity: 0 },
  "scale": { opacity: 0, scale: 0.9 },
  "blur": { opacity: 0, filter: "blur(10px)" },
  "slide-up": { opacity: 0, y: 60, scale: 0.97 },
};

const visibleVariants: Record<AnimationType, Record<string, number | string>> = {
  "fade-up": { opacity: 1, y: 0 },
  "fade-down": { opacity: 1, y: 0 },
  "fade-left": { opacity: 1, x: 0 },
  "fade-right": { opacity: 1, x: 0 },
  "fade": { opacity: 1 },
  "scale": { opacity: 1, scale: 1 },
  "blur": { opacity: 1, filter: "blur(0px)" },
  "slide-up": { opacity: 1, y: 0, scale: 1 },
};

// Create motion components for each tag
const motionComponents = {
  div: motion.div,
  section: motion.section,
  span: motion.span,
  p: motion.p,
};

export default function FadeIn({
  children,
  className = "",
  as: Tag = "div",
  direction = "up",
  animation,
  delay = 0,
  duration = 0.6,
}: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const animType = animation ?? directionToAnimation[direction];
  const MotionTag = motionComponents[Tag];

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={hiddenVariants[animType]}
      animate={isInView ? visibleVariants[animType] : hiddenVariants[animType]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}
