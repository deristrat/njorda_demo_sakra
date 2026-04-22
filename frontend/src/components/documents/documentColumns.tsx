import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils";
import { ComplianceStatusBadge } from "@/components/compliance/ComplianceStatusBadge";
import type { Lang } from "@/lib/language";
import type { DocumentSummary } from "@/types";

export const documentColumnTranslations = {
  sv: {
    selectAll: "Markera alla",
    selectRow: "Markera rad",
    filename: "Filnamn",
    documentType: "Dokumenttyp",
    client: "Klient",
    notLinked: "Ej kopplad",
    advisor: "Rådgivare",
    date: "Datum",
    uploaded: "Uppladdad",
    compliance: "Regelefterlevnad",
    status: "Status",
    docTypeInvestment: "Investeringsrådgivning",
    docTypePension: "Pensionsflytt",
    docTypeInsurance: "Försäkringsrådgivning",
    docTypeSuitability: "Lämplighetsbedömning",
    docTypeUnknown: "Okänd",
    statusUploaded: "Uppladdad",
    statusProcessing: "Bearbetar",
    statusCompleted: "Klar",
    statusFailed: "Misslyckades",
  },
  en: {
    selectAll: "Select all",
    selectRow: "Select row",
    filename: "File name",
    documentType: "Document type",
    client: "Client",
    notLinked: "Not linked",
    advisor: "Advisor",
    date: "Date",
    uploaded: "Uploaded",
    compliance: "Compliance",
    status: "Status",
    docTypeInvestment: "Investment advice",
    docTypePension: "Pension transfer",
    docTypeInsurance: "Insurance advice",
    docTypeSuitability: "Suitability assessment",
    docTypeUnknown: "Unknown",
    statusUploaded: "Uploaded",
    statusProcessing: "Processing",
    statusCompleted: "Completed",
    statusFailed: "Failed",
  },
} satisfies Record<Lang, Record<string, string>>;

type DocColumnsT = typeof documentColumnTranslations["sv"];

function getDocTypeLabels(t: DocColumnsT): Record<string, string> {
  return {
    investment_advice: t.docTypeInvestment,
    pension_transfer: t.docTypePension,
    insurance_advice: t.docTypeInsurance,
    suitability_assessment: t.docTypeSuitability,
    unknown: t.docTypeUnknown,
  };
}

function getStatusLabels(t: DocColumnsT): Record<string, string> {
  return {
    uploaded: t.statusUploaded,
    processing: t.statusProcessing,
    completed: t.statusCompleted,
    failed: t.statusFailed,
  };
}

export function getDocumentColumns(t: DocColumnsT): ColumnDef<DocumentSummary>[] {
  const DOC_TYPE_LABELS = getDocTypeLabels(t);
  const STATUS_LABELS = getStatusLabels(t);

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t.selectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t.selectRow}
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
          {t.filename}
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
          {t.documentType}
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
          {t.client}
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const clientName = row.getValue("client_name") as string | null;
        const clientId = row.original.client_id;
        if (!clientName) return <span className="text-muted-foreground">{t.notLinked}</span>;
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
          {t.advisor}
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
          {t.date}
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
          {t.uploaded}
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
          {t.compliance}
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
          {t.status}
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
}

