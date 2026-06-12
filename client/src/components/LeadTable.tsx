"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { STATUSES, STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatRating, copyToClipboard, truncateUrl } from "@/lib/utils";
import type { Lead, LeadSource, LeadStatus } from "@/types/lead";
import { useToast } from "@/hooks/useToast";

type SortField = "business_name" | "location" | "rating" | "created_at";
type SortDir = "asc" | "desc";

interface LeadTableProps {
  leads: Lead[];
  isLoading: boolean;
  isError: boolean;
  selectedIds: number[];
  onSelectChange: (ids: number[]) => void;
  onSort: (field: SortField, dir: SortDir) => void;
  sortField: SortField;
  sortDir: SortDir;
  onStatusChange: (id: number, status: LeadStatus) => void;
  onDelete: (id: number) => void;
  onViewDetails: (lead: Lead) => void;
  onRetry?: () => void;
  onClearFilters?: () => void;
}

export function LeadTable({
  leads,
  isLoading,
  isError,
  selectedIds,
  onSelectChange,
  onSort,
  sortField,
  sortDir,
  onStatusChange,
  onDelete,
  onViewDetails,
  onRetry,
  onClearFilters,
}: LeadTableProps) {
  const { toast } = useToast();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  if (isLoading) {
    return <LoadingState variant="table" rows={8} columns={7} />;
  }

  if (isError) {
    return (
      <EmptyState
        variant="error"
        onAction={onRetry}
        actionLabel="Retry"
      />
    );
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        variant="no-results"
        onAction={onClearFilters}
        actionLabel="Clear Filters"
      />
    );
  }

  const allSelected = leads.length > 0 && selectedIds.length === leads.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onSelectChange([]);
    } else {
      onSelectChange(leads.map((l) => l.id));
    }
  };

  const toggleOne = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    toast({
      title: ok ? "Copied" : "Failed to copy",
      description: ok ? `${label} copied to clipboard.` : `Could not copy ${label}.`,
      variant: ok ? "success" : "destructive",
    });
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const handleSortClick = (field: SortField) => {
    const newDir = sortField === field && sortDir === "asc" ? "desc" : "asc";
    onSort(field, newDir);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortClick("business_name")}
              >
                <span className="inline-flex items-center">
                  Business Name {renderSortIcon("business_name")}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSortClick("location")}
              >
                <span className="inline-flex items-center">
                  Location {renderSortIcon("location")}
                </span>
              </TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead
                className="cursor-pointer hidden md:table-cell"
                onClick={() => handleSortClick("rating")}
              >
                <span className="inline-flex items-center">
                  Rating {renderSortIcon("rating")}
                </span>
              </TableHead>
              <TableHead className="hidden sm:table-cell">Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer hidden lg:table-cell"
                onClick={() => handleSortClick("created_at")}
              >
                <span className="inline-flex items-center">
                  Created {renderSortIcon("created_at")}
                </span>
              </TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                data-state={selectedIds.includes(lead.id) ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(lead.id)}
                    onCheckedChange={() => toggleOne(lead.id)}
                    aria-label={`Select ${lead.business_name || "lead"}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <button
                    className="text-left hover:text-primary transition-colors"
                    onClick={() => onViewDetails(lead)}
                  >
                    {lead.business_name || "—"}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.location || "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {lead.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {lead.rating !== null ? (
                    <Badge variant="outline">{formatRating(lead.rating)}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary" className="capitalize">
                    {lead.source.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                  {formatDate(lead.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {lead.page_url && (
                        <DropdownMenuItem
                          onClick={() => handleCopy(lead.page_url!, "URL")}
                        >
                          <Copy className="mr-2 h-4 w-4" /> Copy URL
                        </DropdownMenuItem>
                      )}
                      {lead.email && (
                        <DropdownMenuItem
                          onClick={() => handleCopy(lead.email!, "Email")}
                        >
                          <Mail className="mr-2 h-4 w-4" /> Copy Email
                        </DropdownMenuItem>
                      )}
                      {lead.phone && (
                        <DropdownMenuItem
                          onClick={() => handleCopy(lead.phone!, "Phone")}
                        >
                          <Phone className="mr-2 h-4 w-4" /> Copy Phone
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onViewDetails(lead)}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">
                          Change Status
                        </p>
                        <Select
                          value={lead.status}
                          onValueChange={(v) => onStatusChange(lead.id, v as LeadStatus)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteConfirmId(lead.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId !== null) {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
