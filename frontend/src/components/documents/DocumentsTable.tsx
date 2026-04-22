import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Search, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDocuments, deleteDocuments, bulkRecheckCompliance } from "@/lib/api";
import { getDocumentColumns, documentColumnTranslations } from "./documentColumns";
import { useLanguage, type Lang } from "@/lib/language";
import type { DocumentSummary } from "@/types";
import { toast } from "sonner";

const translations = {
  sv: {
    somethingWrong: "Något gick fel",
    searchPlaceholder: "Sök dokument...",
    selected: "markerade",
    checkRules: "Kontrollera regler",
    delete: "Ta bort",
    noDocuments: "Inga dokument hittades.",
    showing: "Visar",
    of: "av",
    documents: "dokument",
  },
  en: {
    somethingWrong: "Something went wrong",
    searchPlaceholder: "Search documents...",
    selected: "selected",
    checkRules: "Check rules",
    delete: "Delete",
    noDocuments: "No documents found.",
    showing: "Showing",
    of: "of",
    documents: "documents",
  },
} satisfies Record<Lang, Record<string, string>>;

interface DocumentsTableProps {
  externalData?: DocumentSummary[];
  externalLoading?: boolean;
  onRefresh?: () => void;
}

export function DocumentsTable({
  externalData,
  externalLoading,
  onRefresh,
}: DocumentsTableProps = {}) {
  const isExternal = externalData !== undefined;
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const columns = useMemo(
    () => getDocumentColumns(documentColumnTranslations[lang]),
    [lang],
  );
  const [data, setData] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [actionLoading, setActionLoading] = useState<"delete" | "recheck" | null>(null);

  useEffect(() => {
    if (isExternal) {
      setData(externalData ?? []);
      setLoading(externalLoading ?? false);
      return;
    }
    fetchDocuments()
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWrong))
      .finally(() => setLoading(false));
  }, [isExternal, externalData, externalLoading, t.somethingWrong]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((r) => r.original.id);

  async function handleDelete() {
    if (selectedIds.length === 0) return;
    setActionLoading("delete");
    try {
      await deleteDocuments(selectedIds);
      if (onRefresh) {
        onRefresh();
      } else {
        setData((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
      }
      setRowSelection({});
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRecheck() {
    if (selectedIds.length === 0) return;
    setActionLoading("recheck");
    try {
      await bulkRecheckCompliance(selectedIds);
      if (onRefresh) {
        onRefresh();
      } else {
        const updated = await fetchDocuments();
        setData(updated);
      }
      setRowSelection({});
    } catch (err) {
      console.error("Recheck failed:", err);
    } finally {
      setActionLoading(null);
    }
  }

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

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} {t.selected}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecheck}
              disabled={actionLoading !== null}
            >
              {actionLoading === "recheck" ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 size-4" />
              )}
              {t.checkRules}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={actionLoading !== null}
            >
              {actionLoading === "delete" ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1 size-4" />
              )}
              {t.delete}
            </Button>
          </div>
        )}
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
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer transition-colors hover:bg-secondary/50"
                  onClick={() => navigate(`/documents/${row.original.id}`)}
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
                  {t.noDocuments}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {t.showing} {table.getRowModel().rows.length} {t.of} {data.length} {t.documents}
      </p>
    </div>
  );
}
