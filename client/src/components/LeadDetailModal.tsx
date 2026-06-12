"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatRating } from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/constants";
import type { Lead } from "@/types/lead";

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailModal({
  lead,
  open,
  onOpenChange,
}: LeadDetailModalProps) {
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lead.business_name || "Unnamed Business"}
            <StatusBadge status={lead.status} />
          </DialogTitle>
          <DialogDescription>
            <Badge variant="secondary" className="capitalize">
              {SOURCE_LABELS[lead.source as keyof typeof SOURCE_LABELS] || lead.source}
            </Badge>
            {" — "}ID: {lead.id}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-2">
          <TabsList className="overflow-x-auto flex-nowrap">
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            {lead.raw_data && <TabsTrigger value="raw">Raw Data</TabsTrigger>}
          </TabsList>

          <TabsContent value="info" className="space-y-3 pt-2 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Business Type</span>
                <p>{lead.business_type || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Location</span>
                <p>{lead.location || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Address</span>
                <p>{lead.address || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Social Handle</span>
                <p>{lead.social_handle || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Rating</span>
                <p>{lead.rating !== null ? formatRating(lead.rating) : "—"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Review Count</span>
                <p>{lead.review_count !== null ? lead.review_count : "—"}</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="font-medium text-muted-foreground">Description</span>
                <p className="mt-1">{lead.description || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Created</span>
                <p>{formatDate(lead.created_at)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Updated</span>
                <p>{formatDate(lead.updated_at)}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-3 pt-2 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Email</span>
                <p>
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-primary hover:underline"
                    >
                      {lead.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Phone</span>
                <p>
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-primary hover:underline"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Page URL</span>
                <p>
                  {lead.page_url ? (
                    <a
                      href={lead.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {lead.page_url}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </TabsContent>

          {lead.raw_data && (
            <TabsContent value="raw" className="pt-2 p-4 sm:p-6">
              <pre className="rounded-md bg-muted p-4 overflow-x-auto text-xs font-mono max-h-64 overflow-y-auto">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(lead.raw_data), null, 2);
                  } catch {
                    return lead.raw_data;
                  }
                })()}
              </pre>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
