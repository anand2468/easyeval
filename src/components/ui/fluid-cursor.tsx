import { useEffect } from "react";
import { useMotionValue, useSpring, motion } from "framer-motion";

export const FluidCursor = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring configuration for the "gas" feel - distinct drag and float
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  
  // Create multiple layers of springs for the "thick" trailing effect
  const x1 = useSpring(mouseX, { ...springConfig, damping: 25, mass: 0.8 });
  const y1 = useSpring(mouseY, { ...springConfig, damping: 25, mass: 0.8 });
  
  const x2 = useSpring(mouseX, { ...springConfig, damping: 35, mass: 1.2 });
  const y2 = useSpring(mouseY, { ...springConfig, damping: 35, mass: 1.2 });
  
  const x3 = useSpring(mouseX, { ...springConfig, damping: 45, mass: 1.5 });
  const y3 = useSpring(mouseY, { ...springConfig, damping: 45, mass: 1.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      <div 
        className="fixed inset-0 z-[5] pointer-events-none overflow-hidden"
        style={{ filter: "url(#goo-effect)" }}
      >
        {/* Core - The dense part of the gas */}
        <motion.div
          className="absolute w-24 h-24 rounded-full bg-cyan-500/40 blur-xl"
          style={{ x: x1, y: y1, translateX: "-50%", translateY: "-50%" }}
        />
        
        {/* Mid Layer - The body of the gas */}
        <motion.div
          className="absolute w-32 h-32 rounded-full bg-blue-600/30 blur-2xl"
          style={{ x: x2, y: y2, translateX: "-50%", translateY: "-50%" }}
        />
        
        {/* Outer Trail - The dissipating gas */}
        <motion.div
          className="absolute w-20 h-20 rounded-full bg-purple-500/20 blur-2xl"
          style={{ x: x3, y: y3, translateX: "-50%", translateY: "-50%" }}
        />
      </div>

      {/* 
        SVG Filter for the "Gooey/Metaball" effect 
        - Blurs the elements together
        - Increases contrast to create sharp edges where they overlap
      */}
      <svg className="fixed hidden">
        <filter id="goo-effect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix 
            in="blur" 
            mode="matrix" 
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" 
            result="goo" 
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>
    </>
  );
};
