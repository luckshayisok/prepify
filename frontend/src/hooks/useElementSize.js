import { useEffect, useRef, useState } from "react";

// Tracks an element's content size, so SVG charts can draw at real pixel dimensions.
export function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (Math.abs(s.width - width) < 0.5 && Math.abs(s.height - height) < 0.5 ? s : { width, height }));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}
