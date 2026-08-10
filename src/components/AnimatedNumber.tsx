import { useEffect, useState } from "react";
import { animate } from "motion/react";

interface AnimatedNumberProps {
  value?: string | number;
  className?: string;
}

export function AnimatedNumber({ value = "", className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState("0");
  
  const safeValue = value !== undefined && value !== null ? String(value) : "";
  
  // Extract number and suffix (e.g. "42%" -> 42 and "%")
  const numericValue = parseFloat(safeValue.replace(/[^0-9.]/g, ""));
  const suffix = safeValue.replace(/[0-9.]/g, "");
  const prefix = safeValue.match(/^[^\d]+/)?.[0] || "";
  const cleanedSuffix = suffix.replace(prefix, "");

  useEffect(() => {
    if (isNaN(numericValue) || !safeValue) {
      setDisplayValue(safeValue);
      return;
    }

    const controls = animate(0, numericValue, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => {
        // Handle decimals if original value had them
        const hasDecimals = safeValue.includes(".");
        setDisplayValue(`${prefix}${latest.toFixed(hasDecimals ? 1 : 0)}${cleanedSuffix}`);
      },
    });

    return () => controls.stop();
  }, [numericValue, safeValue, prefix, cleanedSuffix]);

  return <span className={className}>{displayValue}</span>;
}
