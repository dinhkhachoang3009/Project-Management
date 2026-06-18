import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/routes/types";

export const Watchers = ({ watchers }: { watchers: User[] }) => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium mb-4">
        Watchers ({watchers.length})
      </h3>

      {watchers.length > 0 ? (
        <div className="space-y-3">
          {watchers.map((watcher) => (
            <div key={watcher._id} className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage src={watcher.profilePicture} />
                <AvatarFallback>{watcher.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{watcher.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No watchers yet</p>
      )}
    </div>
  );
};
