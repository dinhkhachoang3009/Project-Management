import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUpdateTaskAssignees } from "@/hooks/use-task";
import type { User } from "@/types";
import { toast } from "sonner";

export const TaskAssigneesSelector = ({
  taskId,
  assignees,
  projectMembers,
}: {
  taskId: string;
  assignees: User[];
  projectMembers: { user: User; role: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const { mutate } = useUpdateTaskAssignees();

  const handleToggle = (userId: string) => {
    const currentIds = assignees.map((a) => a._id);
    const newIds = currentIds.includes(userId)
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId];

    mutate(
      { taskId, assignees: newIds },
      {
        onSuccess: () => toast.success("Assignees updated"),
        onError: () => toast.error("Failed to update assignees"),
      }
    );
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Assignees</h3>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            {assignees.length === 0
              ? "Select assignees"
              : `${assignees.length} assignee${assignees.length > 1 ? "s" : ""}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            {projectMembers.map((member) => (
              <div
                key={member.user._id}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={assignees.some(
                    (a) => a._id === member.user._id
                  )}
                  onCheckedChange={() => handleToggle(member.user._id)}
                />
                <span className="text-sm">{member.user.name}</span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
