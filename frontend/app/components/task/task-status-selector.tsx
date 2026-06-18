import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTaskStatus } from "@/hooks/use-task";
import type { TaskStatus } from "@/routes/types";
import { toast } from "sonner";

export const TaskStatusSelector = ({
  status,
  taskId,
}: {
  status: TaskStatus;
  taskId: string;
}) => {
  const { mutate } = useUpdateTaskStatus();

  const handleChange = (value: string) => {
    mutate(
      { taskId, status: value },
      {
        onSuccess: () => toast.success("Status updated"),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="To Do">To Do</SelectItem>
        <SelectItem value="In Progress">In Progress</SelectItem>
        <SelectItem value="Done">Done</SelectItem>
      </SelectContent>
    </Select>
  );
};
