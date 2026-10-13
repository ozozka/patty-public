import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth";

const navItems = [
  { href: "/admin/dashboard", label: "Panel" },
  { href: "/admin/reports", label: "Bildirimler" },
  { href: "/admin/users", label: "Kullanıcılar" },
  { href: "/admin/metrics", label: "Metrikler" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)]">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
          <span className="font-bold text-white">Patty Admin</span>
        </div>
        <nav className="flex-1 px-2 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mb-1 flex items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-text-active)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="mb-2 text-xs text-white/50">Giriş yapan</p>
          <p className="text-sm text-white/80">{session?.role}</p>
          <form action="/api/admin/logout" method="POST" className="mt-2">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              Çıkış Yap
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
