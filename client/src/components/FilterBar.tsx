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
import { STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { LeadStatus } from "@/types/lead";

interface FilterBarProps {
  selectedStatus?: LeadStatus | "all";
  searchQuery: string;
  onStatusChange: (status: LeadStatus | "all") => void;
  onSearchChange: (query: string) => void;
}

export function FilterBar({
  selectedStatus = "all",
  searchQuery,
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
      <Select
        value={selectedStatus}
        onValueChange={(v) => onStatusChange(v as LeadStatus | "all")}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
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

      <div className="relative flex-1 min-w-0 sm:min-w-[200px] w-full sm:max-w-sm">
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
