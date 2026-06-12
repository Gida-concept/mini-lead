"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/useToast";

interface ExportButtonProps {
  onExport: (format: "csv" | "json") => Promise<void>;
  disabled?: boolean;
}

export function ExportButton({ onExport, disabled = false }: ExportButtonProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  const handleExport = async (format: "csv" | "json") => {
    setExporting(format);
    try {
      await onExport(format);
      toast({
        title: "Export started",
        description: `Your ${format.toUpperCase()} file is being generated.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Export failed",
        description: `Could not export ${format.toUpperCase()} file. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || exporting !== null}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {exporting ? `Exporting ${exporting.toUpperCase()}...` : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={exporting !== null}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport("json")}
          disabled={exporting !== null}
        >
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
