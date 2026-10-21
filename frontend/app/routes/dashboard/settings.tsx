import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { useGetWorkspacesQuery, useGetWorkspaceQuery, useDeleteWorkspaceMutation } from "@/hooks/use-workspace";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { UseDeleteProject } from "@/hooks/use-project";
import { useAuth } from "@/provider/auth-context";
import { getManageableProjects } from "@/lib/permissions";
import type { Project, Workspace } from "@/types";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const Settings = () => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [confirmProject, setConfirmProject] = useState<Project | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [isDeleteWorkspace, setIsDeleteWorkspace] = useState(false);
  const [confirmWsName, setConfirmWsName] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: workspaces } = useGetWorkspacesQuery() as { data: Workspace[] | undefined };
  const { data: workspaceData } = useGetWorkspaceQuery(selectedWorkspaceId) as {
    data: { projects: Project[]; workspace: Workspace } | undefined;
    isLoading: boolean;
  };
  const { mutate: deleteProject, isPending: isDeleting } = UseDeleteProject();
  const { mutate: deleteWorkspace, isPending: isDeletingWorkspace } =
    useDeleteWorkspaceMutation();

  const getUserId = (user: string | { _id: string }): string =>
    typeof user === "string" ? user : user._id;

  // D2: delete listing = project manager OR workspace owner/admin (mirrors
  // the backend deleteProject gate; see lib/permissions)
  const workspaceRole = workspaceData?.workspace?.members?.find(
    (m) => getUserId(m.user) === user?._id?.toString()
  )?.role;

  const manageableProjects = getManageableProjects(
    workspaceData?.projects || [],
    user?._id?.toString(),
    workspaceRole
  );

  // C2: workspace delete is owner-only (backend DELETE /workspaces/:id)
  const selectedWorkspace = workspaceData?.workspace;
  const isWorkspaceOwner =
    !!selectedWorkspace &&
    getUserId(selectedWorkspace.owner) === user?._id?.toString();

  const handleDeleteWorkspace = () => {
    if (!selectedWorkspace) return;
    if (confirmWsName.trim() !== selectedWorkspace.name) {
      toast.error("Workspace name does not match");
      return;
    }

    deleteWorkspace(selectedWorkspace._id, {
      onSuccess: () => {
        toast.success("Workspace deleted successfully");
        setIsDeleteWorkspace(false);
        setConfirmWsName("");
        setSelectedWorkspaceId("");
        navigate("/workspaces");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to delete workspace"
        );
      },
    });
  };

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
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how TaskManager looks for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceSettings />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
          <CardDescription>
            Delete projects you can manage (project manager or workspace
            owner/admin). Select a workspace first.
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
              {manageableProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No projects you can manage in this workspace.
                </p>
              ) : (
                manageableProjects.map((project) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Workspace Management</CardTitle>
          <CardDescription>
            Permanently delete a workspace and everything in it. Owner only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedWorkspace ? (
            <div className="flex items-center justify-between border rounded-md px-4 py-3">
              <div>
                <div className="font-medium">{selectedWorkspace.name}</div>
                <div className="text-xs text-muted-foreground">
                  {workspaceData?.projects?.length ?? 0} project
                  {(workspaceData?.projects?.length ?? 0) !== 1 ? "s" : ""} ·
                  deleting removes them all
                </div>
              </div>
              {isWorkspaceOwner ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteWorkspace(true)}
                >
                  Delete
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Only the workspace owner can delete this workspace.
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a workspace above to manage it.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDeleteWorkspace}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteWorkspace(false);
            setConfirmWsName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              This permanently deletes the workspace with all its projects,
              tasks, comments and activity. This action cannot be undone. Type
              the workspace name <strong>{selectedWorkspace?.name}</strong> to
              confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={confirmWsName}
              onChange={(e) => setConfirmWsName(e.target.value)}
              placeholder="Workspace name"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteWorkspace(false);
                setConfirmWsName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkspace}
              disabled={
                isDeletingWorkspace ||
                confirmWsName.trim() !== selectedWorkspace?.name
              }
            >
              {isDeletingWorkspace ? "Deleting..." : "Delete Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
