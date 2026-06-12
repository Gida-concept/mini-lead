import { Users, Mail, Phone, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsData {
  totalLeads: number;
  withEmail: number;
  withPhone: number;
  newToday?: number;
}

interface StatsCardsProps {
  stats: StatsData | null;
  isLoading: boolean;
  isError: boolean;
  className?: string;
}

export function StatsCards({
  stats,
  isLoading,
  isError,
  className,
}: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">—</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Total Leads",
      value: stats.totalLeads.toLocaleString(),
      icon: Users,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "With Email",
      value: stats.withEmail.toLocaleString(),
      icon: Mail,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "With Phone",
      value: stats.withPhone.toLocaleString(),
      icon: Phone,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "New Today",
      value: (stats.newToday ?? 0).toLocaleString(),
      icon: TrendingUp,
      color: "text-orange-600 bg-orange-100",
    },
  ];

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="hover:-translate-y-0.5 transition-transform duration-200 ease-in-out">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <div className={cn("rounded-lg p-2", item.color)}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
