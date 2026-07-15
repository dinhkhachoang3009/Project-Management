import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useUpdateTaskDescription } from "@/hooks/use-task";
import { toast } from "sonner";

export const TaskDescription = ({
  description,
  taskId,
  readOnly,
}: {
  description: string;
  taskId: string;
  readOnly?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newDescription, setNewDescription] = useState(description || "");
  const { mutate, isPending } = useUpdateTaskDescription();

  const updateDescription = () => {
    mutate(
      { taskId, description: newDescription },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Description updated successfully");
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to update description"
          );
        },
      }
    );
  };

  return (
    <div className="space-y-2">
      {isEditing ? (
        <>
          <Textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={4}
            disabled={isPending}
          />
          <Button size="sm" onClick={updateDescription} disabled={isPending}>
            Save
          </Button>
        </>
      ) : (
        <div className="flex items-start gap-2">
          <p className="text-sm text-muted-foreground flex-1">
            {description || "No description"}
          </p>
          {!readOnly && (
            <Edit
              className="size-4 cursor-pointer text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setIsEditing(true)}
            />
          )}
        </div>
      )}
    </div>
  );
};
