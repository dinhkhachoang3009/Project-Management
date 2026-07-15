import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useAddSubTaskMutation,
  useUpdateSubTaskMutation,
} from "@/hooks/use-task";
import type { Subtask } from "@/types";
import { toast } from "sonner";

export const SubTasksDetails = ({
  subTasks,
  taskId,
  readOnly,
}: {
  subTasks: Subtask[];
  taskId: string;
  readOnly?: boolean;
}) => {
  const [newSubTask, setNewSubTask] = useState("");
  const { mutate: addSubTask, isPending } = useAddSubTaskMutation();
  const { mutate: updateSubTask, isPending: isUpdating } =
    useUpdateSubTaskMutation();

  const handleToggleTask = (subTaskId: string, checked: boolean) => {
    updateSubTask(
      { taskId, subTaskId, completed: checked },
      {
        onSuccess: () => {
          toast.success("Sub task updated successfully");
        },
        onError: (error: any) => {
          const errMessage = error.response?.data?.message || "Failed to update sub task";
          console.log(error);
          toast.error(errMessage);
        },
      }
    );
  };

  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return;
    addSubTask(
      { taskId, title: newSubTask },
      {
        onSuccess: () => {
          setNewSubTask("");
          toast.success("Sub task added successfully");
        },
        onError: (error: any) => {
          const errMessage = error.response?.data?.message || "Failed to add sub task";
          console.log(error);
          toast.error(errMessage);
        },
      }
    );
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-0">
        Sub Tasks
      </h3>

      <div className="space-y-2 mb-4">
        {subTasks.length > 0 ? (
          subTasks.map((subTask) => (
            <div key={subTask._id} className="flex items-center space-x-2">
              <Checkbox
                id={subTask._id}
                checked={subTask.completed}
                onCheckedChange={(checked) =>
                  handleToggleTask(subTask._id, !!checked)
                }
                disabled={readOnly || isUpdating}
              />

              <label
                className={cn(
                  "text-sm",
                  subTask.completed ? "line-through text-muted-foreground" : ""
                )}
              >
                {subTask.title}
              </label>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No sub tasks</div>
        )}
      </div>

      {!readOnly && (
        <div className="flex">
          <Input
            placeholder="Add a sub task"
            value={newSubTask}
            onChange={(e) => setNewSubTask(e.target.value)}
            className="mr-1"
            disabled={isPending}
            onKeyDown={(e) => e.key === "Enter" && handleAddSubTask()}
          />

          <Button
            onClick={handleAddSubTask}
            disabled={isPending || newSubTask.length === 0}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
};
