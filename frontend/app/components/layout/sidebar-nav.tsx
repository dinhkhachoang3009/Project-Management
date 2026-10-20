import { cn } from "@/lib/utils";
import type { Workspace } from "@/types";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router";
import { buttonVariants } from "@/components/ui/button";

interface SidebarNavProps extends React.HtmlHTMLAttributes<HTMLElement> {
  items: {
    title: string;
    href: string;
    icon: LucideIcon;
  }[];
  isCollapsed: boolean;
  currentWorkspace: Workspace | null;
  className?: string;
}

// F4: most dashboard pages carry the workspace context via ?workspaceId=
// (the old Button+navigate() call did the same), but /workspaces resolves
// its workspace from the path itself, so it never takes the query.
export const buildSidebarHref = (
  href: string,
  currentWorkspace: Workspace | null
): string => {
  if (href === "/workspaces" || !currentWorkspace?._id) {
    return href;
  }
  return `${href}?workspaceId=${currentWorkspace._id}`;
};

export const SidebarNav = ({
  items,
  isCollapsed,
  className,
  currentWorkspace,
  ...props
}: SidebarNavProps) => {
  return (
    <nav className={cn("flex flex-col gap-y-2", className)} {...props}>
      {items.map((el) => {
        const Icon = el.icon;

        return (
          <NavLink
            key={el.href}
            to={buildSidebarHref(el.href, currentWorkspace)}
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: isActive ? "outline" : "ghost" }),
                "justify-start",
                isActive && "bg-primary/10 text-primary font-medium"
              )
            }
          >
            <Icon className="mr-2 size-4" />
            {isCollapsed ? (
              <span className="sr-only">{el.title}</span>
            ) : (
              el.title
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
