import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: "table" | "cards" | "stats" | "inline";
  rows?: number;
  columns?: number;
  message?: string;
}

export function LoadingState({
  variant = "table",
  rows = 5,
  columns = 5,
  message,
}: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">
          {message || "Loading..."}
        </span>
      </div>
    );
  }

  if (variant === "stats") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
        {message && (
          <p className="text-center text-sm text-muted-foreground pt-2">
            {message}
          </p>
        )}
      </div>
    );
  }

  // table variant (default)
  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <div className="border-b bg-muted/50 px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b px-4 py-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
      {message && (
        <p className="text-center text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
