import { workspaceSchema } from "@/lib/schema";
import { colorOptions, type WorkspaceForm } from "./create-workspace";
import { ColorPicker } from "./color-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateWorkspaceMutation } from "@/hooks/use-workspace";
import type { Workspace } from "@/types";
import { toast } from "sonner";

interface EditWorkspaceDialogProps {
  workspace: Workspace;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditWorkspaceDialog = ({
  workspace,
  isOpen,
  onOpenChange,
}: EditWorkspaceDialogProps) => {
  const form = useForm<WorkspaceForm>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: workspace.name,
      color: workspace.color || colorOptions[0],
      description: workspace.description || "",
    },
  });
  const { mutate, isPending } = useUpdateWorkspaceMutation();

  // keep the form in sync when the dialog opens for another workspace
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: workspace.name,
        color: workspace.color || colorOptions[0],
        description: workspace.description || "",
      });
    }
  }, [isOpen, workspace, form]);

  const onSubmit = (data: WorkspaceForm) => {
    mutate(
      {
        workspaceId: workspace._id,
        ...data,
      },
      {
        onSuccess: () => {
          toast.success("Workspace updated successfully");
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to update workspace"
          );
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Workspace</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Workspace Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Workspace Description"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        options={colorOptions}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
