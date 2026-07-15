import type { CreateProjectFormData } from "@/components/project/create-project";
import { deleteData, fetchData, postData } from "@/lib/fetch-util";
import { useAuth } from "@/provider/auth-context";
import type { Project } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export const useUserProjectRole = (project?: Project | null) => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!project?.members || !user?._id) return null;
    const member = project.members.find(
      (m) => m.user._id.toString() === user._id.toString()
    );
    return member?.role || null;
  }, [project, user]);
};

export const UseCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      projectData: CreateProjectFormData;
      workspaceId: string;
    }) =>
      postData(
        `/projects/${data.workspaceId}/create-project`,
        data.projectData
      ),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace", data.workspace],
      });
    },
  });
};

export const UseProjectQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchData(`/projects/${projectId}`),
  });
};

export const UseDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => deleteData(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace"],
      });
    },
  });
};
