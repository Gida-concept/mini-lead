"use client";

import { useState } from "react";
import {
  Copy,
  ExternalLink,
  Eye,
  Mail,
  MapPin,
  Phone,
  Star,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { STATUSES, STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatRating, copyToClipboard, truncateText } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/lead";
import { useToast } from "@/hooks/useToast";

interface LeadCardProps {
  lead: Lead;
  onStatusChange: (id: number, status: LeadStatus) => void;
  onDelete: (id: number) => void;
  onViewDetails: (lead: Lead) => void;
}

export function LeadCard({
  lead,
  onStatusChange,
  onDelete,
  onViewDetails,
}: LeadCardProps) {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    toast({
      title: ok ? "Copied" : "Failed to copy",
      description: ok ? `${label} copied to clipboard.` : `Could not copy ${label}.`,
      variant: ok ? "success" : "destructive",
    });
  };

  return (
    <>
      <Card className="w-full hover:shadow-md transition-shadow duration-200 ease-in-out">
        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <button
                className="text-left font-semibold hover:text-primary transition-colors"
                onClick={() => onViewDetails(lead)}
              >
                {lead.business_name || "Unnamed Business"}
              </button>
              <StatusBadge status={lead.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{lead.location || "—"}</span>
              <Badge variant="secondary" className="capitalize text-[10px]">
                {lead.source.replace("_", " ")}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 -mt-1">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {lead.page_url && (
                <DropdownMenuItem onClick={() => window.open(lead.page_url!, '_blank', 'noopener,noreferrer')}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Visit Website
                </DropdownMenuItem>
              )}
              {lead.page_url && (
                <DropdownMenuItem onClick={() => handleCopy(lead.page_url!, "URL")}>
                  <Copy className="mr-2 h-4 w-4" /> Copy URL
                </DropdownMenuItem>
              )}
              {lead.email && (
                <DropdownMenuItem onClick={() => handleCopy(lead.email!, "Email")}>
                  <Mail className="mr-2 h-4 w-4" /> Copy Email
                </DropdownMenuItem>
              )}
              {lead.phone && (
                <DropdownMenuItem onClick={() => handleCopy(lead.phone!, "Phone")}>
                  <Phone className="mr-2 h-4 w-4" /> Copy Phone
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewDetails(lead)}>
                <Eye className="mr-2 h-4 w-4" /> View Details
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
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            {lead.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <a
                  href={`mailto:${lead.email}`}
                  className="text-primary hover:underline truncate"
                >
                  {lead.email}
                </a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <a
                  href={`tel:${lead.phone}`}
                  className="text-primary hover:underline"
                >
                  {lead.phone}
                </a>
              </div>
            )}
            {lead.rating !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>
                  {formatRating(lead.rating)}
                  {lead.review_count !== null && (
                    <span className="text-muted-foreground ml-1">
                      ({lead.review_count} reviews)
                    </span>
                  )}
                </span>
              </div>
            )}
            {lead.address && (
              <div className="flex items-center gap-1 col-span-2">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{lead.address}</span>
              </div>
            )}
          </div>
          {lead.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {truncateText(lead.description, 120)}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDate(lead.created_at)}
          </p>
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {lead.business_name || "this lead"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(lead.id);
                setShowDeleteConfirm(false);
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
