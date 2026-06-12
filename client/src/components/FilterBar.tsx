"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOURCES, STATUSES, SOURCE_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { LeadSource, LeadStatus } from "@/types/lead";

interface FilterBarProps {
  selectedSource?: LeadSource | "all";
  selectedStatus?: LeadStatus | "all";
  searchQuery: string;
  showSource?: boolean;
  onSourceChange?: (source: LeadSource | "all") => void;
  onStatusChange: (status: LeadStatus | "all") => void;
  onSearchChange: (query: string) => void;
}

export function FilterBar({
  selectedSource = "all",
  selectedStatus = "all",
  searchQuery,
  showSource = false,
  onSourceChange,
  onStatusChange,
  onSearchChange,
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery || "");

  // Sync localSearch -> parent via debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  // Sync when parent value changes externally
  useEffect(() => {
    setLocalSearch(searchQuery || "");
  }, [searchQuery]);

  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      {showSource && onSourceChange && (
        <Select
          value={selectedSource}
          onValueChange={(v) => onSourceChange(v as LeadSource | "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {SOURCE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={selectedStatus}
        onValueChange={(v) => onStatusChange(v as LeadStatus | "all")}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, description, or address..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
