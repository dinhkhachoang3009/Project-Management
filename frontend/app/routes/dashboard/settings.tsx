import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useGetWorkspacesQuery, useGetWorkspaceQuery } from "@/hooks/use-workspace";
import { UseDeleteProject } from "@/hooks/use-project";
import { useAuth } from "@/provider/auth-context";
import type { Project, Workspace } from "@/types";
import { toast } from "sonner";

const Settings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskUpdates, setTaskUpdates] = useState(true);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [confirmProject, setConfirmProject] = useState<Project | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const { user } = useAuth();
  const { data: workspaces } = useGetWorkspacesQuery() as { data: Workspace[] | undefined };
  const { data: workspaceData } = useGetWorkspaceQuery(selectedWorkspaceId) as {
    data: { projects: Project[]; workspace: Workspace } | undefined;
    isLoading: boolean;
  };
  const { mutate: deleteProject, isPending: isDeleting } = UseDeleteProject();

  const getUserId = (user: string | { _id: string }): string =>
    typeof user === "string" ? user : user._id;

  const managedProjects =
    workspaceData?.projects?.filter((project) => {
      const member = project.members?.find(
        (m) => getUserId(m.user) === user?._id?.toString()
      );
      return member?.role === "manager";
    }) || [];

  const handleDelete = () => {
    if (!confirmProject) return;
    if (confirmName.trim() !== confirmProject.title) {
      toast.error("Project name does not match");
      return;
    }

    deleteProject(confirmProject._id, {
      onSuccess: () => {
        toast.success("Project deleted successfully");
        setConfirmProject(null);
        setConfirmName("");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete project");
      },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and application settings.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose what notifications you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications about workspace activities.
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="task-updates">Task Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when tasks are assigned or updated.
              </p>
            </div>
            <Switch
              id="task-updates"
              checked={taskUpdates}
              onCheckedChange={setTaskUpdates}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how TaskManager looks for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More appearance options coming soon.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
          <CardDescription>
            Delete projects you manage. Select a workspace first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Select Workspace</Label>
            <Select
              value={selectedWorkspaceId}
              onValueChange={setSelectedWorkspaceId}
            >
              <SelectTrigger className="w-full md:w-[320px]">
                <SelectValue placeholder="Choose a workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces?.map((ws) => (
                  <SelectItem key={ws._id} value={ws._id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedWorkspaceId && (
            <div className="space-y-2">
              {managedProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No projects you manage in this workspace.
                </p>
              ) : (
                managedProjects.map((project) => (
                  <div
                    key={project._id}
                    className="flex items-center justify-between border rounded-md px-4 py-3"
                  >
                    <div>
                      <div className="font-medium">{project.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {project.status}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmProject(project)}
                    >
                      Delete
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!confirmProject}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmProject(null);
            setConfirmName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Type the project name{" "}
              <strong>{confirmProject?.title}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Project name"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmProject(null);
                setConfirmName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || confirmName.trim() !== confirmProject?.title}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
