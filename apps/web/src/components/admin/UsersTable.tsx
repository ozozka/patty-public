"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AccountItem {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  status: "unverified" | "verified" | "banned";
  is_online: boolean;
  report_count: number;
  created_at: string;
}

interface UsersTableProps {
  items: AccountItem[];
  total: number;
  page: number;
  perPage: number;
}

const columnHelper = createColumnHelper<AccountItem>();

const columns = [
  columnHelper.accessor("username", {
    header: "Kullanıcı",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div>
          <p className="font-medium text-[var(--color-text)]">
            @{info.getValue()}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {row.first_name} {row.last_name}
          </p>
        </div>
      );
    },
  }),
  columnHelper.accessor("email", {
    header: "E-posta",
    cell: (info) => (
      <span className="text-sm text-[var(--color-text-secondary)]">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Durum",
    cell: (info) => {
      const status = info.getValue();
      return <Badge variant={status}>{status}</Badge>;
    },
  }),
  columnHelper.accessor("is_online", {
    header: "Çevrimiçi",
    cell: (info) => (
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          info.getValue() ? "bg-[var(--color-success)]" : "bg-gray-300"
        }`}
      />
    ),
  }),
  columnHelper.accessor("report_count", {
    header: "Bildirim",
    cell: (info) => (
      <span
        className={`text-sm ${
          info.getValue() > 0
            ? "font-semibold text-[var(--color-error)]"
            : "text-[var(--color-text-muted)]"
        }`}
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("created_at", {
    header: "Katılım Tarihi",
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
        href={`/admin/users/${info.getValue()}`}
        className="text-xs text-[var(--color-primary)] hover:underline"
      >
        Görüntüle →
      </Link>
    ),
  }),
];

export function UsersTable({ items, total, page, perPage }: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    router.push(`/admin/users?${params.toString()}`);
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="İsim, kullanıcı adı veya e-posta ile ara…"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              updateParams("search", e.target.value);
            }, 400);
          }}
          className="w-72"
        />
        <p className="ml-auto text-sm text-[var(--color-text-muted)]">
          Toplam {total} kullanıcı
        </p>
      </div>

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
                  Kullanıcı bulunamadı
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
