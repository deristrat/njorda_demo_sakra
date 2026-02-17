import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils";
import type { MockClient as Client } from "@/types";

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
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
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "lastContact",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Senaste kontakt
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.getValue("lastContact")),
  },
  {
    accessorKey: "aum",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 h-8 text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        AUM
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-brand text-sm">
        {row.original.aumFormatted}
      </span>
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
        status === "Aktiv"
          ? "default"
          : status === "Ny"
            ? "secondary"
            : "outline";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "attention",
    header: "Uppmärksamhet",
    cell: ({ row }) => {
      if (!row.original.attention) return null;
      return (
        <Tooltip>
          <TooltipTrigger>
            <AlertTriangle className="size-4 text-[#FC4832]" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{row.original.attentionReason}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
];
