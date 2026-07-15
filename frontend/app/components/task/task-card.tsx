import type { Task, TaskStatus } from "@/types";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdateTaskStatus } from "@/hooks/use-task";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
  readOnly?: boolean;
}

export const TaskCard = ({ task, readOnly }: TaskCardProps) => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  const handleStatusChange = (e: React.MouseEvent, status: TaskStatus) => {
    e.stopPropagation();
    updateStatus(
      { taskId: task._id, status },
      {
        onSuccess: () => toast.success(`Marked as ${status}`),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  const handleClick = () => {
    const projectId = typeof task.project === "string" ? task.project : task.project?._id;
    navigate(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${task._id}`
    );
  };

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-1"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge
            className={cn(
              task.priority === "High" && "bg-red-500 text-white",
              task.priority === "Medium" && "bg-orange-500 text-white",
              task.priority === "Low" && "bg-slate-500 text-white"
            )}
          >
            {task.priority}
          </Badge>

          {!readOnly && (
            <div className="flex gap-1">
              {task.status !== "To Do" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={(e) => handleStatusChange(e, "To Do")}
                  title="Mark as To Do"
                >
                  <AlertCircle className="size-4" />
                </Button>
              )}
              {task.status !== "In Progress" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={(e) => handleStatusChange(e, "In Progress")}
                  title="Mark as In Progress"
                >
                  <Clock className="size-4" />
                </Button>
              )}
              {task.status !== "Done" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={(e) => handleStatusChange(e, "Done")}
                  title="Mark as Done"
                >
                  <CheckCircle className="size-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <h4 className="font-medium mb-2">{task.title}</h4>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex -space-x-2">
                {task.assignees.slice(0, 5).map((member: any) => (
                  <Avatar
                    key={member._id}
                    className="relative size-6 bg-gray-700 rounded-full border-2 border-background overflow-hidden"
                    title={member.name}
                  >
                    <AvatarImage src={member.profilePicture} />
                    <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}

                {task.assignees.length > 5 && (
                  <span className="text-xs text-muted-foreground">
                    + {task.assignees.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {task.dueDate && (
            <div className="text-xs text-muted-foreground flex items-center">
              <Calendar className="size-3 mr-1" />
              {format(new Date(task.dueDate), "MMM d, yyyy")}
            </div>
          )}
        </div>

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {task.subtasks.filter((subtask) => subtask.completed).length} /{" "}
            {task.subtasks.length} subtasks
          </div>
        )}
      </CardContent>
    </Card>
  );
};
