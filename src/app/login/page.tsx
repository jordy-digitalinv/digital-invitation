"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{
        background: "#141414",
        fontFamily: "'IBM Plex Sans', Arial, sans-serif",
      }}
    >
      {/* Logo section */}
      <div className="relative shrink-0 h-[45vh] flex items-center justify-center overflow-hidden px-6">
        {/* Mobile: icon-only mark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-512.png"
          alt="Digital Invitation"
          draggable={false}
          className="sm:hidden"
          style={{ width: "128px", height: "128px" }}
        />
        {/* Tablet/desktop: full lockup with wordmark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="Digital Invitation"
          draggable={false}
          className="hidden sm:block"
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", objectPosition: "center" }}
        />
      </div>

      {/* Form section */}
      <div className="shrink-0 w-full max-w-sm mx-auto px-4 pb-10">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl p-7 space-y-5"
          style={{
            background: "#141414",
            border: "1px solid rgba(212,186,119,0.3)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
        >
          <p
            className="text-center text-sm font-medium"
            style={{ color: "#d4ba77", letterSpacing: "0.2em" }}
          >
            ADMIN PANEL
          </p>

          {error && (
            <div
              className="text-sm rounded-lg px-4 py-3"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium tracking-wide" style={{ color: "#d4ba77" }}>
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="admin@example.com"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors placeholder-slate-500 text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(212,186,119,0.22)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,186,119,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(212,186,119,0.22)")}
            />
            {errors.email && (
              <p className="text-xs" style={{ color: "#fca5a5" }}>{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium tracking-wide" style={{ color: "#d4ba77" }}>
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors placeholder-slate-500 text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(212,186,119,0.22)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,186,119,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(212,186,119,0.22)")}
            />
            {errors.password && (
              <p className="text-xs" style={{ color: "#fca5a5" }}>{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-1"
            style={{
              background: "linear-gradient(135deg, #d4ba77, #8a6a35)",
              color: "#0a0a0a",
              letterSpacing: "0.04em",
            }}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
