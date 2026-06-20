import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useUpdateTaskTitle } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskTitle = ({
  title,
  taskId,
}: {
  title: string;
  taskId: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const { mutate, isPending } = useUpdateTaskTitle();

  const updateTitle = () => {
    mutate(
      { taskId, title: newTitle },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Title updated successfully");
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to update title");
        },
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <Input
          className="text-xl font-semibold w-full"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={isPending}
        />
      ) : (
        <h2 className="text-xl flex-1 font-semibold">{title}</h2>
      )}

      {isEditing ? (
        <Button size="sm" onClick={updateTitle} disabled={isPending}>
          Save
        </Button>
      ) : (
        <Edit
          className="size-4 cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};
