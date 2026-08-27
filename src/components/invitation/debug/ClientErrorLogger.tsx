"use client";

import { Component, useEffect, type ReactNode } from "react";

function report(payload: Record<string, unknown>) {
  fetch("/api/debug/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: window.location.href, ...payload }),
  }).catch(() => {});
}

export function ClientErrorLogger({ children }: { children: ReactNode }) {
  useEffect(() => {
    function onError(e: ErrorEvent) {
      report({
        type: "window.onerror",
        message: e.message,
        source: e.filename,
        line: e.lineno,
        col: e.colno,
        stack: e.error?.stack?.slice(0, 2000),
      });
    }
    function onRejection(e: PromiseRejectionEvent) {
      report({
        type: "unhandledrejection",
        message: String(e.reason?.message ?? e.reason),
        stack: String(e.reason?.stack ?? "").slice(0, 2000),
      });
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return <>{children}</>;
}

interface BoundaryState {
  error: Error | null;
}

export class InvitationErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    report({
      type: "render-crash",
      message: error.message,
      stack: error.stack?.slice(0, 2500),
      componentStack: info.componentStack?.slice(0, 1500),
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "3rem 1.5rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <p style={{ fontWeight: 600 }}>Terjadi kesalahan saat menampilkan undangan.</p>
          <p style={{ fontSize: ".8rem", color: "#888", marginTop: ".5rem" }}>
            Laporan otomatis sudah dikirim ke tim. Coba muat ulang halaman.
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: "1rem", padding: ".6rem 1.4rem", borderRadius: 8, border: "none", background: "#1c1c1c", color: "#fff", cursor: "pointer" }}
          >
            Muat Ulang Konten
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
