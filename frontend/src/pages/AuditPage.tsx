import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/AppHeader";
import { fetchAuditEvents, type AuditEventListItem } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useLanguage, type Lang } from "@/lib/language";
import { toast } from "sonner";

const translations = {
  sv: {
    pageTitle: "Audit — Säkra",
    headerTitle: "Audit",
    searchPlaceholder: "Sök händelser...",
    allTypes: "Alla typer",
    colTime: "Tidpunkt",
    colType: "Typ",
    colUser: "Användare",
    colSummary: "Sammanfattning",
    colTarget: "Mål",
    noResults: "Inga händelser hittades.",
    somethingWentWrong: "Något gick fel",
    showingPrefix: "Visar",
    showingMiddle: "av",
    showingSuffix: "händelser",
    eventTypes: {
      "document.uploaded": "Dokument uppladdat",
      "document.deleted": "Dokument borttaget",
      "rule.created": "Regel skapad",
      "rule.updated": "Regel uppdaterad",
      "compliance.recheck": "Regelkontroll",
      "user.login": "Inloggning",
    },
  },
  en: {
    pageTitle: "Audit — Säkra",
    headerTitle: "Audit",
    searchPlaceholder: "Search events…",
    allTypes: "All types",
    colTime: "Time",
    colType: "Type",
    colUser: "User",
    colSummary: "Summary",
    colTarget: "Target",
    noResults: "No events found.",
    somethingWentWrong: "Something went wrong",
    showingPrefix: "Showing",
    showingMiddle: "of",
    showingSuffix: "events",
    eventTypes: {
      "document.uploaded": "Document uploaded",
      "document.deleted": "Document deleted",
      "rule.created": "Rule created",
      "rule.updated": "Rule updated",
      "compliance.recheck": "Compliance recheck",
      "user.login": "Login",
    },
  },
} satisfies Record<Lang, {
  pageTitle: string;
  headerTitle: string;
  searchPlaceholder: string;
  allTypes: string;
  colTime: string;
  colType: string;
  colUser: string;
  colSummary: string;
  colTarget: string;
  noResults: string;
  somethingWentWrong: string;
  showingPrefix: string;
  showingMiddle: string;
  showingSuffix: string;
  eventTypes: Record<string, string>;
}>;

type T = typeof translations["sv"];

function getColumns(t: T): ColumnDef<AuditEventListItem>[] {
  return [
    {
      accessorKey: "created_at",
      header: t.colTime,
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-sm">
          {formatDateTime(getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: "event_type",
      header: t.colType,
      cell: ({ getValue }) => {
        const type = getValue<string>();
        return (
          <Badge variant="outline" className="font-normal">
            {(t.eventTypes as Record<string, string>)[type] ?? type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "actor",
      header: t.colUser,
    },
    {
      accessorKey: "summary",
      header: t.colSummary,
    },
    {
      id: "target",
      header: t.colTarget,
      cell: ({ row }) => {
        const { target_type, target_id } = row.original;
        if (!target_type && !target_id) return null;
        return (
          <span className="text-sm text-muted-foreground">
            {target_type && <span>{target_type}</span>}
            {target_id && (
              <>
                {target_type && " "}
                <span className="font-mono">{target_id}</span>
              </>
            )}
          </span>
        );
      },
    },
  ];
}

export function AuditPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [data, setData] = useState<AuditEventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("__all__");

  const columns = useMemo(() => getColumns(t), [t]);

  const eventTypeOptions = useMemo(
    () => [
      { value: "__all__", label: t.allTypes },
      ...Object.entries(t.eventTypes).map(([value, label]) => ({ value, label })),
    ],
    [t],
  );

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  useEffect(() => {
    setLoading(true);
    fetchAuditEvents(
      eventTypeFilter !== "__all__" ? { event_type: eventTypeFilter } : undefined,
    )
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTypeFilter]);

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

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="p-6 space-y-4">
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
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[200px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
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
                        onClick={() => navigate(`/audit/${row.original.id}`)}
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
                        {t.noResults}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              {t.showingPrefix} {table.getRowModel().rows.length} {t.showingMiddle} {data.length} {t.showingSuffix}
            </p>
          </>
        )}
      </div>
    </>
  );
}
