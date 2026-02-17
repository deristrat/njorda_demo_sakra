import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Advisor } from "@/types";

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  const color =
    score >= 80
      ? "text-green-700 bg-green-50"
      : score >= 50
        ? "text-yellow-700 bg-yellow-50"
        : "text-red-700 bg-red-50";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${color}`}>
      {score}
    </span>
  );
}

export const advisorListColumns: ColumnDef<Advisor>[] = [
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
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("advisor_name")}</span>
    ),
  },
  {
    accessorKey: "firm_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Företag
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) =>
      row.getValue("firm_name") || (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "document_count",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Dokument
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const count = row.getValue("document_count") as number;
      return <Badge variant="secondary">{count}</Badge>;
    },
  },
  {
    accessorKey: "client_count",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Klienter
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const count = row.getValue("client_count") as number;
      return <Badge variant="secondary">{count}</Badge>;
    },
  },
  {
    accessorKey: "avg_compliance_score",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Snittpoäng
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <ScoreBadge score={row.getValue("avg_compliance_score") as number | null} />
    ),
  },
  {
    accessorKey: "clients_with_issues",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Klienter med avvikelser
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const issues = row.getValue("clients_with_issues") as number;
      if (issues === 0) {
        return <span className="text-muted-foreground">0</span>;
      }
      return (
        <span className="inline-flex items-center gap-1 text-destructive font-medium">
          <AlertTriangle className="size-3.5" />
          {issues}
        </span>
      );
    },
  },
  {
    accessorKey: "latest_document_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Senaste dokument
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const val = row.getValue("latest_document_date") as string | null;
      if (!val) return <span className="text-muted-foreground">—</span>;
      return formatDate(val);
    },
  },
];
