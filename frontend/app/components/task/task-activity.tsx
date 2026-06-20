import { fetchData } from "@/lib/fetch-util";
import { useQuery } from "@tanstack/react-query";
import type { ActivityLog } from "@/routes/types";
import {
  CheckCircle2,
  Circle,
  MessageSquare,
  Pencil,
  PlusCircle,
  UserPlus,
} from "lucide-react";

const getActivityIcon = (action: string) => {
  switch (action) {
    case "created_task":
      return <PlusCircle className="size-4" />;
    case "updated_task":
      return <Pencil className="size-4" />;
    case "completed_task":
      return <CheckCircle2 className="size-4" />;
    case "created_subtask":
      return <PlusCircle className="size-4" />;
    case "updated_subtask":
      return <Pencil className="size-4" />;
    case "added_comment":
      return <MessageSquare className="size-4" />;
    case "joined_workspace":
    case "added_member":
      return <UserPlus className="size-4" />;
    default:
      return <Circle className="size-4" />;
  }
};

const getActivityDescription = (action: string, details?: any) => {
  switch (action) {
    case "created_task":
      return "created this task";
    case "updated_task":
      if (details?.field) {
        return `updated the ${details.field}`;
      }
      return "updated this task";
    case "completed_task":
      return "completed this task";
    case "created_subtask":
      return `added subtask "${details?.title || ""}"`;
    case "updated_subtask":
      return `updated subtask`;
    case "added_comment":
      return "added a comment";
    case "joined_workspace":
      return "joined the workspace";
    case "created_workspace":
      return "created the workspace";
    case "created_project":
      return "created the project";
    default:
      return action.replace(/_/g, " ");
  }
};

export const TaskActivity = ({ resourceId }: { resourceId: string }) => {
  const { data, isPending } = useQuery({
    queryKey: ["task-activity", resourceId],
    queryFn: () => fetchData(`/tasks/${resourceId}/activity`),
  }) as {
    data: ActivityLog[];
    isPending: boolean;
  };

  if (isPending)
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h3 className="text-lg text-muted-foreground mb-4">Activity</h3>

      <div className="space-y-4">
        {data?.map((activity) => (
          <div key={activity._id} className="flex gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {getActivityIcon(activity.action)}
            </div>

            <div>
              <p className="text-sm">
                <span className="font-medium">
                  {activity.user?.name || "Unknown"}
                </span>{" "}
                {getActivityDescription(activity.action, activity.details)}
              </p>
              <p className="text-xs text-muted-foreground">
                {activity.createdAt
                  ? new Date(activity.createdAt).toLocaleString()
                  : ""}
              </p>
            </div>
          </div>
        ))}

        {(!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        )}
      </div>
    </div>
  );
};
