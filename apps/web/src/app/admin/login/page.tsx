"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        const errorBodySchema = z.object({ message: z.string().optional() });
        const body = errorBodySchema.safeParse(await res.json());
        setError(
          body.success
            ? (body.data.message ?? "Geçersiz kimlik bilgileri")
            : "Geçersiz kimlik bilgileri",
        );
      }
    } catch {
      setError("Ağ hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Patty Admin
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Yönetici paneline giriş yap
          </p>
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4">
            <Input
              label="E-posta"
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              placeholder="admin@patty.app"
              required
            />
            <Input
              label="Şifre"
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              placeholder="••••••••"
              required
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-error)]">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Giriş Yap
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
