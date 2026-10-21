import { BackButton } from "@/components/back-button";
import { Loader } from "@/components/loader";
import { CommentSection } from "@/components/task/comment-section";
import { SubTasksDetails } from "@/components/task/sub-tasks";
import { TaskActivity } from "@/components/task/task-activity";
import { TaskAssigneesSelector } from "@/components/task/task-assignees-selector";
import { TaskDescription } from "@/components/task/task-description";
import { TaskPrioritySelector } from "@/components/task/task-priority-selector";
import { TaskStatusSelector } from "@/components/task/task-status-selector";
import { TaskTitle } from "@/components/task/task-title";
import { Watchers } from "@/components/task/watchers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAchievedTaskMutation,
  useTaskByIdQuery,
  useWatchTaskMutation,
} from "@/hooks/use-task";
import { useUserProjectRole } from "@/hooks/use-project";
import { useAuth } from "@/provider/auth-context";
import type { Project, Task } from "@/types";
import { getTaskPriorityColor } from "@/lib";
import { NoDataFound } from "@/components/no-data-found";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Eye, EyeOff } from "lucide-react";
import { useParams } from "react-router";
import { toast } from "sonner";

const TaskDetails = () => {
  const { user } = useAuth();
  const { taskId } = useParams<{ taskId: string }>();

  const { data, isLoading } = useTaskByIdQuery(taskId!) as {
    data: {
      task: Task;
      project: Project;
    };
    isLoading: boolean;
  };

  const { mutate: watchTask, isPending: isWatching } = useWatchTaskMutation();
  const { mutate: achievedTask, isPending: isAchieved } =
    useAchievedTaskMutation();

  const userRole = useUserProjectRole(data?.project);

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (!data) {
    return (
      <NoDataFound
        title="Task not found"
        description="The task may have been deleted, or you may not have access."
      />
    );
  }

  const { task, project } = data;

  const isReadOnly = userRole === "viewer";

  const isUserWatching = task?.watchers?.some(
    (watcher) => watcher._id.toString() === user?._id?.toString()
  );

  const handleWatchTask = () => {
    watchTask(
      { taskId: task._id },
      {
        onSuccess: () => toast.success(isUserWatching ? "Unwatched" : "Watching"),
        onError: () => toast.error("Failed to update watch status"),
      }
    );
  };

  const handleAchievedTask = () => {
    achievedTask(
      { taskId: task._id },
      {
        onSuccess: () => toast.success(task.isArchived ? "Unarchived" : "Archived"),
        onError: () => toast.error("Failed to archive task"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-center">
          <BackButton />

          <h1 className="text-xl md:text-2xl font-bold">{task.title}</h1>

          {task.isArchived && (
            <Badge className="ml-2" variant="outline">
              Archived
            </Badge>
          )}
        </div>

        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWatchTask}
            disabled={isWatching}
          >
            {isUserWatching ? (
              <>
                <EyeOff className="mr-2 size-4" />
                Unwatch
              </>
            ) : (
              <>
                <Eye className="mr-2 size-4" />
                Watch
              </>
            )}
          </Button>

          {!isReadOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAchievedTask}
              disabled={isAchieved}
            >
              {task.isArchived ? "Unarchive" : "Archive"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:flex-2">
          <Card>
            <CardContent className="p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
              <div>
                <Badge
                  className={cn("mb-2 capitalize", getTaskPriorityColor(task.priority))}
                >
                  {task.priority} Priority
                </Badge>

                <TaskTitle title={task.title} taskId={task._id} readOnly={isReadOnly} />

                <div className="text-sm md:text-base text-muted-foreground">
                  Created:{" "}
                  {formatDistanceToNow(new Date(task.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <TaskStatusSelector status={task.status} taskId={task._id} readOnly={isReadOnly} />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </h3>
              <TaskDescription
                description={task.description || ""}
                taskId={task._id}
                readOnly={isReadOnly}
              />
            </div>

            <div className="mb-6">
              <TaskAssigneesSelector
                taskId={task._id}
                assignees={task.assignees || []}
                projectMembers={project.members?.map((m) => ({
                  user: m.user,
                  role: m.role,
                })) || []}
                readOnly={isReadOnly}
              />
            </div>

            <div className="mb-6">
              <TaskPrioritySelector
                priority={task.priority}
                taskId={task._id}
                readOnly={isReadOnly}
              />
            </div>

            <SubTasksDetails
              subTasks={task.subtasks || []}
              taskId={task._id}
              readOnly={isReadOnly}
            />
            </CardContent>
          </Card>

          <CommentSection taskId={task._id} />

          <TaskActivity resourceId={task._id} />
        </div>

        <div className="lg:flex-1">
          <Watchers watchers={task.watchers || []} />
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
