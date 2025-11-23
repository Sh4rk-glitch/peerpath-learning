import { useEffect, useRef, useState } from "react";

type Options = IntersectionObserverInit & { freezeOnceVisible?: boolean };

export default function useInView(options: Options = { threshold: 0.15 }) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options.freezeOnceVisible) {
            observer.unobserve(entry.target);
          }
        } else if (!options.freezeOnceVisible) {
          setInView(false);
        }
      });
    }, options);

    observer.observe(node);

    return () => observer.disconnect();
  }, [ref, options.threshold, options.root, options.rootMargin, options.freezeOnceVisible]);

  return { ref, inView } as const;
}
