import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchClients } from "@/lib/api";
import { getClientListColumns } from "./clientListColumns";
import { useLanguage, type Lang } from "@/lib/language";
import type { Client } from "@/types";
import { toast } from "sonner";

const translations = {
  sv: {
    somethingWentWrong: "Något gick fel",
    searchPlaceholder: "Sök klienter...",
    emptyState:
      "Inga klienter hittats. Ladda upp dokument med personnummer för att skapa klienter automatiskt.",
    showing: "Visar",
    of: "av",
    clients: "klienter",
    clientName: "Klientnamn",
    personNumber: "Personnummer",
    documents: "Dokument",
    issues: "Avvikelser",
    warnings: "Varningar",
    email: "E-post",
    latestDocument: "Senaste dokument",
    unknown: "Okänd",
  },
  en: {
    somethingWentWrong: "Something went wrong",
    searchPlaceholder: "Search clients...",
    emptyState:
      "No clients found. Upload documents with personal numbers to create clients automatically.",
    showing: "Showing",
    of: "of",
    clients: "clients",
    clientName: "Client name",
    personNumber: "Personal number",
    documents: "Documents",
    issues: "Issues",
    warnings: "Warnings",
    email: "Email",
    latestDocument: "Latest document",
    unknown: "Unknown",
  },
} satisfies Record<Lang, Record<string, string>>;

export function ClientsListTable() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    fetchClients()
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong))
      .finally(() => setLoading(false));
  }, [t.somethingWentWrong]);

  const columns = useMemo(
    () =>
      getClientListColumns({
        clientName: t.clientName,
        personNumber: t.personNumber,
        documents: t.documents,
        issues: t.issues,
        warnings: t.warnings,
        email: t.email,
        latestDocument: t.latestDocument,
        unknown: t.unknown,
      }),
    [t],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="bg-card pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer transition-colors hover:bg-secondary/50"
                  onClick={() => navigate(`/clients/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t.emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {t.showing} {table.getRowModel().rows.length} {t.of} {data.length} {t.clients}
      </p>
    </div>
  );
}
