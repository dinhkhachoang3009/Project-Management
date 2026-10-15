import { Header } from "@/components/layout/header";
import { SidebarComponent } from "@/components/layout/sidebar-component";
import { Loader } from "@/components/loader";
import { CreateWorkspace } from "@/components/workspace/create-workspace";
import { fetchData } from "@/lib/fetch-util";
import { useAuth } from "@/provider/auth-context";
import type { Workspace } from "@/types";
import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useLoaderData,
  useLocation,
  useMatches,
  useNavigate,
  useSearchParams,
} from "react-router";

export const clientLoader = async () => {
  try {
    const [workspaces] = await Promise.all([fetchData("/workspaces")]);
    return { workspaces };
  } catch (error) {
    return { workspaces: [] };
  }
};
const DashboardLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const loaderData = useLoaderData() as { workspaces: Workspace[] } | undefined;
  const workspaces = loaderData?.workspaces || [];
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const matches = useMatches();
  const navigate = useNavigate();

  useEffect(() => {
    if (workspaces.length === 0) return;
    const paramId = searchParams.get("workspaceId");
    const pathId =
      matches.find((m) => m.params.workspaceId)?.params.workspaceId ?? null;
    const id = paramId || pathId;
    const lastWorkspaceId = localStorage.getItem("lastWorkspaceId");

    if (id) {
      const workspace = workspaces.find((ws) => ws._id === id);
      if (!workspace) {
        if (lastWorkspaceId === id) {
          localStorage.removeItem("lastWorkspaceId");
        }
        return;
      }
      localStorage.setItem("lastWorkspaceId", id);
      if (currentWorkspace?._id !== id) {
        setCurrentWorkspace(workspace);
      }
      return;
    }

    if (location.pathname === "/dashboard" && lastWorkspaceId) {
      const workspace = workspaces.find((ws) => ws._id === lastWorkspaceId);
      if (workspace) {
        navigate(`/dashboard?workspaceId=${lastWorkspaceId}`, {
          replace: true,
        });
        if (currentWorkspace?._id !== lastWorkspaceId) {
          setCurrentWorkspace(workspace);
        }
      } else {
        localStorage.removeItem("lastWorkspaceId");
      }
    }
  }, [searchParams, matches, workspaces, currentWorkspace, location.pathname]);

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />;
  }

  const handleWorkspaceSelected = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
  };

  return (
    <div className="flex h-screen w-full">
      <SidebarComponent currentWorkspace={currentWorkspace} />

      <div className="flex flex-1 flex-col h-full">
        <Header
          onWorkspaceSelected={handleWorkspaceSelected}
          selectedWorkspace={currentWorkspace}
          onCreateWorkspace={() => setIsCreatingWorkspace(true)}
        />

        <main className="flex-1 overflow-y-auto h-full w-full">
          <div className="mx-auto container px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CreateWorkspace
        isCreatingWorkspace={isCreatingWorkspace}
        setIsCreatingWorkspace={setIsCreatingWorkspace}
      />
    </div>
  );
};

export default DashboardLayout;
