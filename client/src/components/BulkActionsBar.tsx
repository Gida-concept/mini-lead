"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkStatus: (status: LeadStatus) => void;
  onBulkDelete: () => void;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  onBulkStatus,
  onBulkDelete,
  className,
}: BulkActionsBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t bg-background shadow-lg transition-all duration-200 ease-in-out",
          className
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Set status:
              </span>
              <Select
                onValueChange={(v) => onBulkStatus(v as LeadStatus)}
              >
                <SelectTrigger className="h-10 w-[140px]">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Delete All
            </Button>
          </div>
        </div>
      </div>
      <div className="h-16" /> {/* Spacer for fixed bar */}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} Leads</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} lead
              {selectedCount !== 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onBulkDelete();
                setShowDeleteConfirm(false);
              }}
            >
              Delete {selectedCount} lead{selectedCount !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
