import { FileSearch, SearchX, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "no-results" | "no-searches" | "no-exports" | "error";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: React.ElementType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const variantConfig: Record<
  EmptyStateVariant,
  { icon: React.ElementType; defaultTitle: string; defaultDescription: string; defaultAction?: string }
> = {
  "no-results": {
    icon: SearchX,
    defaultTitle: "No leads found",
    defaultDescription: "Try adjusting your filters or run a new search.",
    defaultAction: "Clear Filters",
  },
  "no-searches": {
    icon: FileSearch,
    defaultTitle: "No searches yet",
    defaultDescription: "Run your first search to start collecting leads.",
    defaultAction: "New Search",
  },
  "no-exports": {
    icon: Inbox,
    defaultTitle: "No exports yet",
    defaultDescription: "Export your leads as CSV or JSON from any source page.",
  },
  error: {
    icon: SearchX,
    defaultTitle: "Something went wrong",
    defaultDescription: "We could not load the data. Please try again.",
    defaultAction: "Retry",
  },
};

export function EmptyState({
  variant = "no-results",
  icon: IconOverride,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = IconOverride || config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {title || config.defaultTitle}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description || config.defaultDescription}
      </p>
      {action ? (
        <div className="mt-4">{action}</div>
      ) : (actionLabel || config.defaultAction) && onAction ? (
        <Button variant="outline" className="mt-4" onClick={onAction}>
          {actionLabel || config.defaultAction}
        </Button>
      ) : null}
    </div>
  );
}
