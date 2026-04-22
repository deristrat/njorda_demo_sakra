import { useState, useMemo } from "react";
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
import { clients } from "@/data/clients";
import { getColumns } from "./columns";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    searchPlaceholder: "Sök klient...",
    emptyState: "Inga klienter hittades.",
    showing: "Visar",
    of: "av",
    clients: "klienter",
    clientName: "Klientnamn",
    lastContact: "Senaste kontakt",
    aum: "AUM",
    status: "Status",
    attention: "Uppmärksamhet",
    statusActive: "Aktiv",
    statusInactive: "Inaktiv",
    statusNew: "Ny",
  },
  en: {
    searchPlaceholder: "Search client...",
    emptyState: "No clients found.",
    showing: "Showing",
    of: "of",
    clients: "clients",
    clientName: "Client name",
    lastContact: "Last contact",
    aum: "AUM",
    status: "Status",
    attention: "Attention",
    statusActive: "Active",
    statusInactive: "Inactive",
    statusNew: "New",
  },
} satisfies Record<Lang, Record<string, string>>;

export function ClientsTable() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () =>
      getColumns({
        clientName: t.clientName,
        lastContact: t.lastContact,
        aum: t.aum,
        status: t.status,
        attention: t.attention,
        statusActive: t.statusActive,
        statusInactive: t.statusInactive,
        statusNew: t.statusNew,
      }),
    [t],
  );

  const table = useReactTable({
    data: clients,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t.searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="bg-card pl-9"
        />
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
                  className="transition-colors hover:bg-secondary/50"
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
        {t.showing} {table.getRowModel().rows.length} {t.of} {clients.length} {t.clients}
      </p>
    </div>
  );
}
