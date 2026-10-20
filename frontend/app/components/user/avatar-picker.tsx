import { AVATAR_OPTIONS } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export const AvatarPicker = ({ value, onChange }: AvatarPickerProps) => (
  <div
    role="radiogroup"
    aria-label="Choose an avatar"
    className="grid grid-cols-8 gap-2"
  >
    {AVATAR_OPTIONS.map((src) => (
      <button
        key={src}
        type="button"
        role="radio"
        aria-checked={value === src}
        aria-label={`Avatar ${src}`}
        onClick={() => onChange(src)}
        className={cn(
          "rounded-full overflow-hidden border-2 transition-all cursor-pointer",
          value === src
            ? "border-primary ring-2 ring-ring"
            : "border-transparent hover:opacity-80"
        )}
      >
        <img src={src} alt="" className="size-8 block" />
      </button>
    ))}
  </div>
);
