import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTaskStatus } from "@/hooks/use-task";
import type { TaskStatus } from "@/types";
import { toast } from "sonner";

export const TaskStatusSelector = ({
  status,
  taskId,
  readOnly,
}: {
  status: TaskStatus;
  taskId: string;
  readOnly?: boolean;
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

  if (readOnly) {
    return (
      <span className="inline-flex items-center rounded-md border px-3 py-1 text-sm font-medium w-[140px]">
        {status}
      </span>
    );
  }

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
