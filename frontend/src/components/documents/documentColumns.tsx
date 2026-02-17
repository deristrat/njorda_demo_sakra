import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils";
import { ComplianceStatusBadge } from "@/components/compliance/ComplianceStatusBadge";
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
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Markera alla"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Markera rad"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    cell: ({ row }) => {
      const clientName = row.getValue("client_name") as string | null;
      const clientId = row.original.client_id;
      if (!clientName) return <span className="text-muted-foreground">Ej kopplad</span>;
      if (clientId) {
        return (
          <a
            href={`/clients/${clientId}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {clientName}
          </a>
        );
      }
      return clientName;
    },
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
    cell: ({ row }) => {
      const advisorName = row.getValue("advisor_name") as string | null;
      const advisorId = row.original.advisor_id;
      if (!advisorName) return <span className="text-muted-foreground">—</span>;
      if (advisorId) {
        return (
          <a
            href={`/advisors/${advisorId}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {advisorName}
          </a>
        );
      }
      return advisorName;
    },
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
    accessorKey: "compliance_score",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Regelefterlevnad
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <ComplianceStatusBadge
        status={row.original.compliance_status}
        score={row.original.compliance_score}
        summary={row.original.compliance_summary}
      />
    ),
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
