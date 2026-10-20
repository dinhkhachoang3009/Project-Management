// D2 (decided 2026-10-21): mirrors the backend gate in
// project-controller.js resolveProjectLifecycleRole — the project manager
// OR the workspace owner/admin can manage (edit/delete) a project; an
// owner/admin does not need to be a project member.
export const canManageProject = (
  projectRole: string | null | undefined,
  workspaceRole: string | null | undefined
): boolean => {
  if (projectRole === "manager") return true;
  return workspaceRole === "owner" || workspaceRole === "admin";
};

interface ProjectLike {
  members?: { user: string | { _id: string }; role: string }[];
}

const getUserIdFromMember = (user: string | { _id: string }): string =>
  typeof user === "string" ? user : user._id;

// D2 delete listing (Settings): the projects a user may delete — every
// project when they are a workspace owner/admin, else only the ones they
// manage. Mirrors the backend deleteProject gate.
export const getManageableProjects = <P extends ProjectLike>(
  projects: P[],
  userId: string | undefined,
  workspaceRole: string | null | undefined
): P[] =>
  projects.filter((project) => {
    const memberRole = project.members?.find(
      (m) => getUserIdFromMember(m.user) === userId?.toString()
    )?.role;
    return canManageProject(memberRole, workspaceRole);
  });
