import { useEffect, useState } from "react";
import { animate } from "motion/react";

interface AnimatedNumberProps {
  value: string;
  className?: string;
}

export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState("0");
  
  // Extract number and suffix (e.g. "42%" -> 42 and "%")
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ""));
  const suffix = value.replace(/[0-9.]/g, "");
  const prefix = value.match(/^[^\d]+/)?.[0] || "";
  const cleanedSuffix = suffix.replace(prefix, "");

  useEffect(() => {
    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(0, numericValue, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => {
        // Handle decimals if original value had them
        const hasDecimals = value.includes(".");
        setDisplayValue(`${prefix}${latest.toFixed(hasDecimals ? 1 : 0)}${cleanedSuffix}`);
      },
    });

    return () => controls.stop();
  }, [numericValue, value, prefix, cleanedSuffix]);

  return <span className={className}>{displayValue}</span>;
}
