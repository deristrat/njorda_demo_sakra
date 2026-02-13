import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { DocumentSummary } from "@/types";

const DOC_TYPE_LABELS: Record<string, string> = {
  investment_advice: "Investeringsrådgivning",
  pension_transfer: "Pensionsflytt",
  insurance_advice: "Försäkringsrådgivning",
  suitability_assessment: "Lämplighetsbedömning",
  unknown: "Okänd",
};

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Uppladdad",
  processing: "Bearbetar",
  completed: "Klar",
  failed: "Misslyckades",
};

export const documentColumns: ColumnDef<DocumentSummary>[] = [
  {
    accessorKey: "original_filename",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Filnamn
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("original_filename")}</span>
    ),
  },
  {
    accessorKey: "document_type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Dokumenttyp
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const docType = row.getValue("document_type") as string | null;
      if (!docType) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge variant="secondary">
          {DOC_TYPE_LABELS[docType] || docType}
        </Badge>
      );
    },
  },
  {
    accessorKey: "client_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Klient
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => row.getValue("client_name") || <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "advisor_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Rådgivare
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => row.getValue("advisor_name") || <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "document_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Datum
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const val = row.getValue("document_date") as string | null;
      if (!val) return <span className="text-muted-foreground">—</span>;
      return formatDate(val);
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Uppladdad
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.getValue("created_at")),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant =
        status === "completed"
          ? "default"
          : status === "failed"
            ? "destructive"
            : "secondary";
      return <Badge variant={variant}>{STATUS_LABELS[status] || status}</Badge>;
    },
  },
];
