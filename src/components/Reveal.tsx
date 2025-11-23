import React from "react";
import useInView from "@/hooks/useInView";

type Props = {
  children: React.ReactNode;
  className?: string;
  anim?: "up" | "left" | "fade";
  threshold?: number;
};

const Reveal: React.FC<Props> = ({ children, className = "", anim = "up", threshold = 0.15 }) => {
  const { ref, inView } = useInView({ threshold, freezeOnceVisible: true });
  const animClass = anim === "up" ? "reveal-up" : anim === "left" ? "reveal-left" : "reveal-fade";

  return (
    <div
      ref={ref as any}
      className={`reveal ${animClass} ${inView ? "in-view" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

export default Reveal;
