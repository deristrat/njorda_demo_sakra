import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Client } from "@/types";

export const clientListColumns: ColumnDef<Client>[] = [
  {
    accessorKey: "person_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Klientnamn
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {row.getValue("person_name") || "Okänd"}
      </span>
    ),
  },
  {
    accessorKey: "person_number",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Personnummer
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-brand text-sm">
        {row.getValue("person_number")}
      </span>
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
    accessorKey: "compliance_issues_red",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Avvikelser
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const issues = row.getValue("compliance_issues_red") as number;
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
    accessorKey: "compliance_issues_yellow",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Varningar
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const issues = row.getValue("compliance_issues_yellow") as number;
      if (issues === 0) {
        return <span className="text-muted-foreground">0</span>;
      }
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
          <AlertTriangle className="size-3.5" />
          {issues}
        </span>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        E-post
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) =>
      row.getValue("email") || (
        <span className="text-muted-foreground">—</span>
      ),
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
