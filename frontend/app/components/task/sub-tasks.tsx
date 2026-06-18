import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useUpdateTask } from "@/hooks/use-task";
import type { Subtask } from "@/routes/types";
import { toast } from "sonner";

export const SubTasksDetails = ({
  subTasks,
  taskId,
}: {
  subTasks: Subtask[];
  taskId: string;
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const { mutate } = useUpdateTask();

  const handleToggle = (index: number) => {
    const updated = subTasks.map((st, i) =>
      i === index ? { ...st, completed: !st.completed } : st
    );
    mutate(
      { taskId, subtasks: updated },
      {
        onSuccess: () => toast.success("Subtask updated"),
        onError: () => toast.error("Failed to update subtask"),
      }
    );
  };

  const handleAdd = () => {
    if (!newSubtaskTitle.trim()) return;
    const updated = [
      ...subTasks,
      { title: newSubtaskTitle, completed: false },
    ];
    mutate(
      { taskId, subtasks: updated },
      {
        onSuccess: () => {
          setNewSubtaskTitle("");
          toast.success("Subtask added");
        },
        onError: () => toast.error("Failed to add subtask"),
      }
    );
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Subtasks</h3>

      <div className="space-y-2">
        {subTasks.map((subtask, index) => (
          <div key={subtask._id || index} className="flex items-center gap-2">
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => handleToggle(index)}
            />
            <span
              className={`text-sm ${
                subtask.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {subtask.title}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a subtask"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
};
