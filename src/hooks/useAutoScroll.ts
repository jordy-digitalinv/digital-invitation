"use client";

import { useEffect } from "react";

/**
 * Auto scroll halus ke bawah seluruh halaman setelah undangan dibuka.
 * Berhenti permanen saat tamu menyentuh / scroll sendiri, atau saat mencapai dasar halaman.
 *
 * @param enabled  status toggle auto scroll dari Theme
 * @param active   true ketika cover sudah dibuka
 * @param startDelay jeda sebelum mulai scroll (ms)
 */
export function useAutoScroll(
  enabled: boolean | null | undefined,
  active: boolean,
  startDelay = 2500
) {
  useEffect(() => {
    if (!enabled || !active) return;

    const SPEED = 40; // px per detik — kecepatan scroll sinematik
    let animId = 0;
    let lastTime = performance.now();
    let stopped = false;
    let pos = window.scrollY;

    function tick(now: number) {
      if (stopped) return;
      const delta = Math.min(now - lastTime, 100);
      lastTime = now;
      pos += (SPEED * delta) / 1000;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const target = Math.min(Math.round(pos), maxScroll);
      window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
      if (target < maxScroll) animId = requestAnimationFrame(tick);
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("mousedown", stop);
      window.removeEventListener("keydown", stop);
    }

    const timer = setTimeout(() => {
      window.addEventListener("touchstart", stop, { passive: true });
      window.addEventListener("wheel", stop, { passive: true });
      window.addEventListener("mousedown", stop);
      window.addEventListener("keydown", stop);
      // Berhenti saat tamu mengisi form (RSVP/ucapan) agar tidak saling tarik fokus
      window.addEventListener("focusin", stop);
      animId = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      stopped = true;
      cancelAnimationFrame(animId);
      clearTimeout(timer);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("mousedown", stop);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("focusin", stop);
    };
  }, [enabled, active]);
}
