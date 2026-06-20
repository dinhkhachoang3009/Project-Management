import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetMyTasksQuery } from "@/hooks/use-task";
import { Loader } from "@/components/loader";
import type { Task } from "@/types";
import { format } from "date-fns";
import { Archive, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

const Achieved = () => {
  const { data: myTasks, isLoading } = useGetMyTasksQuery() as {
    data: Task[];
    isLoading: boolean;
  };

  const archivedTasks = myTasks?.filter((task) => task.isArchived) || [];

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Achieved</h1>
        <p className="text-muted-foreground">
          View your archived tasks and projects.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="size-5" />
            Archived Tasks
          </CardTitle>
          <CardDescription>
            {archivedTasks.length} archived task{archivedTasks.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {archivedTasks.length > 0 ? (
            <div className="divide-y">
              {archivedTasks.map((task) => (
                <div
                  key={task._id}
                  className="py-4 flex items-center justify-between"
                >
                  <div>
                    <Link
                      to={`/workspaces/${typeof task.project === "string" ? task.project : task.project?._id}/projects/${typeof task.project === "string" ? task.project : task.project?._id}/tasks/${task._id}`}
                      className="font-medium hover:text-primary hover:underline transition-colors flex items-center"
                    >
                      {task.title}
                      <ArrowUpRight className="size-4 ml-1" />
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{task.status}</Badge>
                      <Badge variant="secondary">{task.priority}</Badge>
                      <Badge variant="outline">Archived</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {task.dueDate && (
                      <div>Due: {format(task.dueDate, "PPP")}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No archived tasks yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Achieved;
