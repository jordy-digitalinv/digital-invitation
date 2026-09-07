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
        background:
          "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(200,169,107,0.16), transparent 70%), linear-gradient(180deg, #000 0%, #141414 55%, #000 100%)",
        fontFamily: "'IBM Plex Sans', Arial, sans-serif",
      }}
    >
      {/* Logo section */}
      <div className="relative shrink-0 h-[45vh] flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="Digital Invitation"
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
        />
        {/* Fade into form */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: "120px", background: "linear-gradient(to bottom, transparent, #000)" }}
        />
      </div>

      {/* Form section */}
      <div className="shrink-0 w-full max-w-sm mx-auto px-4 pb-10">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl p-7 space-y-5 backdrop-blur-md"
          style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(212,168,92,0.3)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
        >
          <p
            className="text-center text-sm font-medium"
            style={{ color: "#D4A85C", letterSpacing: "0.2em" }}
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
            <label className="block text-xs font-medium tracking-wide" style={{ color: "#c9a86c" }}>
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="admin@example.com"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors placeholder-slate-500 text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(212,168,92,0.22)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,168,92,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(212,168,92,0.22)")}
            />
            {errors.email && (
              <p className="text-xs" style={{ color: "#fca5a5" }}>{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium tracking-wide" style={{ color: "#c9a86c" }}>
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors placeholder-slate-500 text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(212,168,92,0.22)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,168,92,0.6)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(212,168,92,0.22)")}
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
              background: "linear-gradient(135deg, #D4A85C, #a8752d)",
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
