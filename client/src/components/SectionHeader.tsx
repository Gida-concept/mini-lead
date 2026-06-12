import { Globe, Camera, MapPin, Facebook } from "lucide-react";
import type { LeadSource } from "@/types/lead";
import { SOURCE_LABELS } from "@/lib/constants";

interface SectionHeaderProps {
  source: LeadSource;
  leadCount?: number;
}

const sourceIcons: Record<LeadSource, React.ElementType> = {
  facebook: Facebook,
  instagram: Camera,
  google_web: Globe,
  google_maps: MapPin,
};

export function SectionHeader({ source, leadCount }: SectionHeaderProps) {
  const Icon = sourceIcons[source];
  const label = SOURCE_LABELS[source];

  return (
    <div className="flex items-center gap-3 pb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
        <p className="text-sm text-muted-foreground">
          {leadCount !== undefined
            ? `${leadCount} lead${leadCount !== 1 ? "s" : ""}`
            : "Loading..."}
        </p>
      </div>
    </div>
  );
}
