import { Loader } from "@/components/loader";
import { NoDataFound } from "@/components/no-data-found";
import { CreateProjectDialog } from "@/components/project/create-project";
import { EditWorkspaceDialog } from "@/components/workspace/edit-workspace-dialog";
import { InviteMemberDialog } from "@/components/workspace/invite-member";
import { ProjectList } from "@/components/workspace/project-list";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { useGetWorkspaceQuery } from "@/hooks/use-workspace";
import { useAuth } from "@/provider/auth-context";
import type { Project, Workspace } from "@/types";
import { useState } from "react";
import { useParams } from "react-router";

const WorkspaceDetails = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isCreateProject, setIsCreateProject] = useState(false);
  const [isInviteMember, setIsInviteMember] = useState(false);
  const [isEditWorkspace, setIsEditWorkspace] = useState(false);
  const { user } = useAuth();

  if (!workspaceId) {
    return (
      <NoDataFound
        title="Workspace not found"
        description="Select or open a workspace to see its projects."
      />
    );
  }

  const { data, isLoading } = useGetWorkspaceQuery(workspaceId) as {
    data: {
      workspace: Workspace;
      projects: Project[];
    };
    isLoading: boolean;
  };

  // C1: workspace edit is admin/owner-gated (backend PUT /workspaces/:id)
  const currentUserRole = data?.workspace?.members?.find(
    (member) =>
      (typeof member.user === "string"
        ? member.user
        : member.user._id) === user?._id?.toString()
  )?.role;
  const canEditWorkspace =
    currentUserRole === "owner" || currentUserRole === "admin";

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WorkspaceHeader
        workspace={data.workspace}
        members={data?.workspace?.members?.map((member) => ({
          _id: member._id,
          user: member.user,
          role: member.role,
          joinedAt: member.joinedAt,
        })) || []}
        onCreateProject={() => setIsCreateProject(true)}
        onInviteMember={() => setIsInviteMember(true)}
        canEditWorkspace={canEditWorkspace}
        onEditWorkspace={() => setIsEditWorkspace(true)}
      />

      <ProjectList
        workspaceId={workspaceId}
        projects={data.projects}
        onCreateProject={() => setIsCreateProject(true)}
      />

      <CreateProjectDialog
        isOpen={isCreateProject}
        onOpenChange={setIsCreateProject}
        workspaceId={workspaceId}
        workspaceMembers={data.workspace.members?.map((member) => ({
          _id: member._id,
          user: member.user,
          role: member.role,
          joinedAt: member.joinedAt,
        })) || []}
      />

      <InviteMemberDialog
        isOpen={isInviteMember}
        onOpenChange={setIsInviteMember}
        workspaceId={workspaceId}
      />

      {data.workspace && (
        <EditWorkspaceDialog
          workspace={data.workspace}
          isOpen={isEditWorkspace}
          onOpenChange={setIsEditWorkspace}
        />
      )}
    </div>
  );
};

export default WorkspaceDetails;
