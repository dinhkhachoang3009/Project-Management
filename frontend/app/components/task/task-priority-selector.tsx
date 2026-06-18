import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTaskPriority } from "@/hooks/use-task";
import type { TaskPriority } from "@/routes/types";
import { toast } from "sonner";

export const TaskPrioritySelector = ({
  priority,
  taskId,
}: {
  priority: TaskPriority;
  taskId: string;
}) => {
  const { mutate } = useUpdateTaskPriority();

  const handleChange = (value: string) => {
    mutate(
      { taskId, priority: value },
      {
        onSuccess: () => toast.success("Priority updated"),
        onError: () => toast.error("Failed to update priority"),
      }
    );
  };

  return (
    <Select value={priority} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Low">Low</SelectItem>
        <SelectItem value="Medium">Medium</SelectItem>
        <SelectItem value="High">High</SelectItem>
      </SelectContent>
    </Select>
  );
};
