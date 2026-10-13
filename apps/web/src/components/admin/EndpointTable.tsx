interface EndpointRow {
  path: string;
  method: string;
  request_count: number;
  error_count: number;
  avg_ms: number;
  error_rate: number;
}

interface EndpointTableProps {
  endpoints: EndpointRow[];
}

export function EndpointTable({ endpoints }: EndpointTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--color-surface-sunken)]">
          <tr>
            <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
              Metot
            </th>
            <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
              Yol
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">
              İstekler
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">
              Hatalar
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">
              Ort. ms
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">
              Hata oranı
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {endpoints.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-[var(--color-text-muted)]"
              >
                Henüz veri yok — veri toplamak için önce istek gönderin
              </td>
            </tr>
          ) : (
            endpoints.map((ep) => (
              <tr
                key={`${ep.method}:${ep.path}`}
                className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] transition-colors"
              >
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                      ep.method === "GET"
                        ? "bg-blue-100 text-blue-700"
                        : ep.method === "POST"
                          ? "bg-green-100 text-green-700"
                          : ep.method === "PATCH" || ep.method === "PUT"
                            ? "bg-amber-100 text-amber-700"
                            : ep.method === "DELETE"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ep.method}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-text)]">
                  {ep.path}
                </td>
                <td className="px-4 py-3 text-right">
                  {ep.request_count.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      ep.error_count > 0 ? "text-[var(--color-error)]" : ""
                    }
                  >
                    {ep.error_count.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{ep.avg_ms}ms</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      ep.error_rate > 0.1
                        ? "text-[var(--color-error)]"
                        : ep.error_rate > 0.05
                          ? "text-[var(--color-secondary)]"
                          : "text-[var(--color-success)]"
                    }
                  >
                    {(ep.error_rate * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
