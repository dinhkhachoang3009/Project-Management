import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/provider/theme-context";

// F11: built the dark work — F6/F7/F11 token cleanup makes this render
// correctly across every page.
export const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="dark-mode-switch">Dark mode</Label>
        <p className="text-xs text-muted-foreground">
          Switch between light and dark theme.
        </p>
      </div>
      <Switch
        id="dark-mode-switch"
        aria-label="Dark mode"
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  );
};
