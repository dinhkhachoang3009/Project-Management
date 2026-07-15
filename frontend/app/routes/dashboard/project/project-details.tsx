import { BackButton } from "@/components/back-button";
import { Loader } from "@/components/loader";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { TaskCard } from "@/components/task/task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectTasksQuery } from "@/hooks/use-task";
import { useUserProjectRole } from "@/hooks/use-project";
import { getProjectProgress } from "@/lib";
import type { Project, Task, TaskStatus } from "@/types";
import { useState } from "react";
import { useParams } from "react-router";

const ProjectDetails = () => {
  const { projectId, workspaceId } = useParams<{
    projectId: string;
    workspaceId: string;
  }>();

  const [isCreateTask, setIsCreateTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskStatus | "All">("All");

  const { data, isLoading } = useProjectTasksQuery(projectId!) as {
    data: {
      tasks: Task[];
      project: Project;
    };
    isLoading: boolean;
  };

  const userRole = useUserProjectRole(data?.project);
  const canCreateTask = userRole === "manager" || userRole === "contributor";

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (!data) {
    return <div>Project not found</div>;
  }

  const { project, tasks } = data;
  const projectProgress = getProjectProgress(tasks);

  const filteredTasks =
    taskFilter === "All" ? tasks : tasks.filter((t) => t.status === taskFilter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BackButton />
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold">{project.title}</h1>
          </div>
          {project.description && (
            <p className="text-sm text-gray-500">{project.description}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 min-w-32">
            <div className="text-sm text-muted-foreground">Progress:</div>
            <div className="flex-1">
              <Progress value={projectProgress} className="h-2" />
            </div>
            <span className="text-sm text-muted-foreground">
              {projectProgress}%
            </span>
          </div>

          {canCreateTask && (
            <Button onClick={() => setIsCreateTask(true)}>Add Task</Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setTaskFilter("All")}>
                All Tasks
              </TabsTrigger>
              <TabsTrigger value="todo" onClick={() => setTaskFilter("To Do")}>
                To Do
              </TabsTrigger>
              <TabsTrigger
                value="in-progress"
                onClick={() => setTaskFilter("In Progress")}
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger value="done" onClick={() => setTaskFilter("Done")}>
                Done
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center text-sm gap-2">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className="bg-background">
                {tasks.filter((task) => task.status === "To Do").length} To Do
              </Badge>
              <Badge variant="outline" className="bg-background">
                {tasks.filter((task) => task.status === "In Progress").length}{" "}
                In Progress
              </Badge>
              <Badge variant="outline" className="bg-background">
                {tasks.filter((task) => task.status === "Done").length} Done
              </Badge>
            </div>
          </div>

          <TabsContent value="all" className="m-0">
            <TaskBoard tasks={filteredTasks} readOnly={!canCreateTask} />
          </TabsContent>

          <TabsContent value="todo" className="m-0">
            <TaskBoard tasks={filteredTasks} readOnly={!canCreateTask} />
          </TabsContent>

          <TabsContent value="in-progress" className="m-0">
            <TaskBoard tasks={filteredTasks} readOnly={!canCreateTask} />
          </TabsContent>

          <TabsContent value="done" className="m-0">
            <TaskBoard tasks={filteredTasks} readOnly={!canCreateTask} />
          </TabsContent>
        </Tabs>
      </div>

      <CreateTaskDialog
        open={isCreateTask}
        onOpenChange={setIsCreateTask}
        projectId={projectId!}
      />
    </div>
  );
};

const TaskBoard = ({ tasks, readOnly }: { tasks: Task[]; readOnly?: boolean }) => {
  const todoTasks = tasks.filter((t) => t.status === "To Do");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const doneTasks = tasks.filter((t) => t.status === "Done");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TaskColumn title="To Do" tasks={todoTasks} readOnly={readOnly} />
      <TaskColumn title="In Progress" tasks={inProgressTasks} readOnly={readOnly} />
      <TaskColumn title="Done" tasks={doneTasks} readOnly={readOnly} />
    </div>
  );
};

const TaskColumn = ({ title, tasks, readOnly }: { title: string; tasks: Task[]; readOnly?: boolean }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <Badge variant="outline">{tasks.length}</Badge>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No tasks yet
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task._id} task={task} readOnly={readOnly} />)
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
