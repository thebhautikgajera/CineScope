import { useEffect } from 'react';
import Lenis from 'lenis';

export const useLenis = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lenis = new Lenis({
      lerp: 0.09,
      duration: 1.1,
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 1.2,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });

    let frameId;

    const raf = (time) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };

    frameId = requestAnimationFrame(raf);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);
};

