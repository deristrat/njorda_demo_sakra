import { useState, useEffect } from "react";
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
import { toast } from "sonner";

const EVENT_TYPE_LABELS: Record<string, string> = {
  "document.uploaded": "Dokument uppladdat",
  "document.deleted": "Dokument borttaget",
  "rule.created": "Regel skapad",
  "rule.updated": "Regel uppdaterad",
  "compliance.recheck": "Regelkontroll",
  "user.login": "Inloggning",
};

const EVENT_TYPE_OPTIONS = [
  { value: "__all__", label: "Alla typer" },
  { value: "document.uploaded", label: "Dokument uppladdat" },
  { value: "document.deleted", label: "Dokument borttaget" },
  { value: "rule.created", label: "Regel skapad" },
  { value: "rule.updated", label: "Regel uppdaterad" },
  { value: "compliance.recheck", label: "Regelkontroll" },
  { value: "user.login", label: "Inloggning" },
];

function targetLink(targetType: string | null, targetId: string | null): string | null {
  if (!targetType || !targetId) return null;
  if (targetType === "document") return `/documents/${targetId}`;
  if (targetType === "rule") return `/settings/compliance/${targetId}`;
  return null;
}

const columns: ColumnDef<AuditEventListItem>[] = [
  {
    accessorKey: "created_at",
    header: "Tidpunkt",
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-sm">
        {formatDateTime(getValue<string>())}
      </span>
    ),
  },
  {
    accessorKey: "event_type",
    header: "Typ",
    cell: ({ getValue }) => {
      const type = getValue<string>();
      return (
        <Badge variant="outline" className="font-normal">
          {EVENT_TYPE_LABELS[type] ?? type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "actor",
    header: "Användare",
  },
  {
    accessorKey: "summary",
    header: "Sammanfattning",
  },
  {
    id: "target",
    header: "Mål",
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

export function AuditPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AuditEventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("__all__");

  useEffect(() => {
    document.title = "Audit — Säkra";
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAuditEvents(
      eventTypeFilter !== "__all__" ? { event_type: eventTypeFilter } : undefined,
    )
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Något gick fel"))
      .finally(() => setLoading(false));
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
      <AppHeader title="Audit" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Sök händelser..."
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
              {EVENT_TYPE_OPTIONS.map((opt) => (
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
                        Inga händelser hittades.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              Visar {table.getRowModel().rows.length} av {data.length} händelser
            </p>
          </>
        )}
      </div>
    </>
  );
}
