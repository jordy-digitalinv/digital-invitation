const VERCEL_API = "https://api.vercel.com";

function vercelHeaders() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function teamQuery() {
  return process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";
}

// Setiap client baru butuh subdomain sendiri (<slug>.digital-invitation.my.id).
// Wildcard SSL cert di Vercel gak reliable buat multi-tenant kayak gini (lihat catatan
// di README/percakapan setup), jadi tiap subdomain didaftarkan individual — Vercel
// nerbitin cert HTTP-01 otomatis per domain begitu didaftarkan, jauh lebih stabil.
export async function addClientDomain(slug: string): Promise<void> {
  if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) return;

  const domain = process.env.NEXT_PUBLIC_INVITATION_DOMAIN ?? "digital-invitation.my.id";
  const name = `${slug}.${domain}`;

  try {
    const res = await fetch(
      `${VERCEL_API}/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains${teamQuery()}`,
      { method: "POST", headers: vercelHeaders(), body: JSON.stringify({ name }) }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`[vercel] gagal daftarin domain ${name}:`, body?.error?.message ?? res.status);
    }
  } catch (err) {
    console.error(`[vercel] gagal daftarin domain ${name}:`, err);
  }
}

export async function removeClientDomain(slug: string): Promise<void> {
  if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) return;

  const domain = process.env.NEXT_PUBLIC_INVITATION_DOMAIN ?? "digital-invitation.my.id";
  const name = `${slug}.${domain}`;

  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${name}${teamQuery()}`,
      { method: "DELETE", headers: vercelHeaders() }
    );
    if (!res.ok && res.status !== 404) {
      const body = await res.json().catch(() => ({}));
      console.error(`[vercel] gagal hapus domain ${name}:`, body?.error?.message ?? res.status);
    }
  } catch (err) {
    console.error(`[vercel] gagal hapus domain ${name}:`, err);
  }
}
