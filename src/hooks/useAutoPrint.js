import { useEffect, useState } from "react";

export default function useAutoPrint({
  enabled,
  ready,
  delay = 500,
  resetKey = "",
}) {
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    setPrinted((current) => (current ? false : current));
  }, [resetKey]);

  useEffect(() => {
    if (!enabled || !ready || printed) return undefined;

    setPrinted(true);
    const timer = setTimeout(() => window.print(), delay);
    return () => clearTimeout(timer);
  }, [delay, enabled, printed, ready]);
}
