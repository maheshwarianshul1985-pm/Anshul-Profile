import { useApp } from "../contexts/AppContext";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

interface EditableProps {
  value: string | number;
  onChange: (val: string) => void;
  as?: any;
  className?: string;
  multiline?: boolean;
}

export function Editable({ 
  value, 
  onChange, 
  as: Component = "span", 
  className,
  multiline = false
}: EditableProps) {
  const { isEditing } = useApp();
  const [localValue, setLocalValue] = useState(value !== undefined ? String(value) : "");

  useEffect(() => {
    setLocalValue(value !== undefined ? String(value) : "");
  }, [value]);

  if (!isEditing) {
    return <Component className={cn(className, "break-words")}>{value !== undefined ? value : ""}</Component>;
  }

  const inputClasses = cn(
    "bg-primary/5 border border-dashed border-primary/50 outline-none w-full p-1 -m-1 rounded-none focus:bg-primary/10 transition-colors inline-block", 
    className
  );

  if (multiline) {
     return (
       <textarea
         className={cn(inputClasses, "resize-y overflow-hidden")}
         value={localValue}
         onChange={(e) => {
           setLocalValue(e.target.value);
           e.target.style.height = 'inherit';
           e.target.style.height = `${e.target.scrollHeight}px`;
         }}
         onBlur={() => onChange(localValue)}
         rows={localValue.split('\n').length || 1}
       />
     );
  }

  return (
    <input
      type="text"
      className={inputClasses}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
    />
  );
}
