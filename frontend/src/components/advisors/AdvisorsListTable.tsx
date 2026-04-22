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
import { fetchAdvisors } from "@/lib/api";
import { getAdvisorListColumns } from "./advisorListColumns";
import { useLanguage, type Lang } from "@/lib/language";
import type { Advisor } from "@/types";
import { toast } from "sonner";

const translations = {
  sv: {
    somethingWentWrong: "Något gick fel",
    searchPlaceholder: "Sök rådgivare...",
    emptyState:
      "Inga rådgivare hittats. Ladda upp dokument för att skapa rådgivare automatiskt.",
    showing: "Visar",
    of: "av",
    advisors: "rådgivare",
    advisor: "Rådgivare",
    firm: "Företag",
    documents: "Dokument",
    clients: "Klienter",
    avgScore: "Snittpoäng",
    issues: "Avvikelser",
    warnings: "Varningar",
    latestDocument: "Senaste dokument",
  },
  en: {
    somethingWentWrong: "Something went wrong",
    searchPlaceholder: "Search advisors...",
    emptyState:
      "No advisors found. Upload documents to create advisors automatically.",
    showing: "Showing",
    of: "of",
    advisors: "advisors",
    advisor: "Advisor",
    firm: "Firm",
    documents: "Documents",
    clients: "Clients",
    avgScore: "Avg. score",
    issues: "Issues",
    warnings: "Warnings",
    latestDocument: "Latest document",
  },
} satisfies Record<Lang, Record<string, string>>;

export function AdvisorsListTable() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [data, setData] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    fetchAdvisors()
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong))
      .finally(() => setLoading(false));
  }, [t.somethingWentWrong]);

  const columns = useMemo(
    () =>
      getAdvisorListColumns({
        advisor: t.advisor,
        firm: t.firm,
        documents: t.documents,
        clients: t.clients,
        avgScore: t.avgScore,
        issues: t.issues,
        warnings: t.warnings,
        latestDocument: t.latestDocument,
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
                  onClick={() => navigate(`/advisors/${row.original.id}`)}
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
        {t.showing} {table.getRowModel().rows.length} {t.of} {data.length} {t.advisors}
      </p>
    </div>
  );
}
