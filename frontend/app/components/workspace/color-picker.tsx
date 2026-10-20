import { useId } from "react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  options: string[];
  value: string;
  onChange: (color: string) => void;
  name?: string;
}

// F3: keyboard-accessible color swatches. Real radio inputs (visually
// hidden, not display:none) group and arrow-navigate natively; the
// visible swatch reacts to focus via peer classes.
export const ColorPicker = ({
  options,
  value,
  onChange,
  name,
}: ColorPickerProps) => {
  const autoId = useId();
  const groupName = name ?? `color-picker-${autoId}`;

  return (
    <div className="flex gap-3 flex-wrap" role="radiogroup" aria-label="Color">
      {options.map((color) => (
        <label key={color} className="relative inline-flex cursor-pointer">
          <input
            type="radio"
            name={groupName}
            value={color}
            checked={value === color}
            onChange={() => onChange(color)}
            aria-label={color}
            className="peer sr-only"
          />
          <span className="sr-only">{color}</span>
          <span
            className={cn(
              "w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
              value === color &&
                "ring-2 ring-ring ring-offset-2 ring-offset-background"
            )}
            style={{ backgroundColor: color }}
          ></span>
        </label>
      ))}
    </div>
  );
};
