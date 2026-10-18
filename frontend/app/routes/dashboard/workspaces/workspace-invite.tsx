import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import {
  useAcceptInviteByTokenMutation,
  useGetWorkspaceDetailsQuery,
} from "@/hooks/use-workspace";
import type { Workspace } from "@/types";
import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

const WorkspaceInvite = () => {
  const { workspaceId } = useParams();

  const [searchParams] = useSearchParams();

  const token = searchParams.get("tk");

  const navigate = useNavigate();

  if (!workspaceId) {
    return <div>Workspace not found</div>;
  }

  // details may 403 for non-members (that is correct now) — the join flow
  // must not depend on member-only data; identity is shown when available
  const { data: workspace, isLoading } = useGetWorkspaceDetailsQuery(
    workspaceId!
  ) as { data: Workspace; isLoading: boolean };

  const {
    mutate: acceptInviteByToken,
    isPending: isAcceptInviteByTokenPending,
  } = useAcceptInviteByTokenMutation();

  const handleAcceptInvite = () => {
    if (!workspaceId || !token) return;

    acceptInviteByToken(token, {
      onSuccess: () => {
        toast.success("Invitation accepted");
        navigate(`/workspaces/${workspaceId}`);
      },
      onError: (error: any) => {
        toast.error(error.response.data.message);
      },
    });
  };

  const handleDeclineInvite = () => {
    toast.info("Invitation declined");
    navigate("/workspaces");
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  // no token at all = the old raw link, which is closed (decision D3)
  const isInvalidInvite = !token;

  if (isInvalidInvite || !workspace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className={isInvalidInvite ? "max-w-md" : "max-w-md w-full"}>
          <CardHeader>
            <CardTitle>
              {isInvalidInvite ? "Invalid Invitation" : "Join workspace"}
            </CardTitle>
            <CardDescription>
              {isInvalidInvite
                ? "This workspace invitation is invalid or has expired."
                : "You've been invited to join this workspace."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isInvalidInvite ? (
              <Button
                onClick={() => navigate("/workspaces")}
                className="w-full"
              >
                Go to Workspaces
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleAcceptInvite}
                  disabled={isAcceptInviteByTokenPending}
                >
                  {isAcceptInviteByTokenPending ? "Joining..." : "Accept Invitation"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDeclineInvite}
                  disabled={isAcceptInviteByTokenPending}
                >
                  Decline
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <WorkspaceAvatar name={workspace.name} color={workspace.color} />
            <CardTitle>{workspace.name}</CardTitle>
          </div>
          <CardDescription>
            You've been invited to join the "<strong>{workspace.name}</strong>"
            workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workspace.description && (
            <p className="text-sm text-muted-foreground">
              {workspace.description}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="default"
              className="flex-1"
              onClick={handleAcceptInvite}
              disabled={isAcceptInviteByTokenPending}
            >
              {isAcceptInviteByTokenPending ? "Joining..." : "Accept Invitation"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDeclineInvite}
              disabled={isAcceptInviteByTokenPending}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceInvite;
