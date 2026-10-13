"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const reportStatusSchema = z.enum([
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);

interface ReportItem {
  id: string;
  reporter_username: string;
  target_type: string;
  target_username: string | null;
  reason: string;
  status: string;
  created_at: string;
}

interface ReportsTableProps {
  items: ReportItem[];
  total: number;
  page: number;
  perPage: number;
}

const statusOptions = [
  { value: "", label: "Tüm durumlar" },
  { value: "pending", label: "Beklemede" },
  { value: "reviewed", label: "İnceleniyor" },
  { value: "resolved", label: "Çözüldü" },
  { value: "dismissed", label: "Reddedildi" },
];

const columnHelper = createColumnHelper<ReportItem>();

const columns = [
  columnHelper.accessor("reporter_username", {
    header: "Bildiren",
    cell: (info) => (
      <span className="font-medium text-[var(--color-text)]">
        @{info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("target_type", {
    header: "Hedef",
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {info.getValue()}
          {row.target_username ? ` · @${row.target_username}` : ""}
        </span>
      );
    },
  }),
  columnHelper.accessor("reason", {
    header: "Neden",
    cell: (info) => (
      <span className="capitalize text-sm">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Durum",
    cell: (info) => {
      const raw = info.getValue();
      const parsed = reportStatusSchema.safeParse(raw);
      const status = parsed.success ? parsed.data : "default";
      return <Badge variant={status}>{raw}</Badge>;
    },
  }),
  columnHelper.accessor("created_at", {
    header: "Tarih",
    cell: (info) => (
      <span className="text-sm text-[var(--color-text-muted)]">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  }),
  columnHelper.accessor("id", {
    header: "",
    cell: (info) => (
      <Link
        href={`/admin/reports/${info.getValue()}`}
        className="text-xs text-[var(--color-primary)] hover:underline"
      >
        Görüntüle →
      </Link>
    ),
  }),
];

export function ReportsTable({
  items,
  total,
  page,
  perPage,
}: ReportsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/admin/reports?${params.toString()}`);
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          options={statusOptions}
          value={searchParams.get("status") ?? ""}
          onChange={(e) => {
            updateParams("status", e.target.value);
          }}
          placeholder="Duruma göre filtrele"
          className="w-48"
        />
        <p className="ml-auto text-sm text-[var(--color-text-muted)]">
          Toplam {total} bildirim
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-surface-sunken)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-medium text-[var(--color-text-secondary)]"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                >
                  Bildirim bulunamadı
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                updateParams("page", String(page - 1));
              }}
            >
              ← Önceki
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                updateParams("page", String(page + 1));
              }}
            >
              Sonraki →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
