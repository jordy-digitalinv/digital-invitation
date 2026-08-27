import { randomBytes } from "crypto";

export function generateGuestToken(guestName?: string): string {
  const random = randomBytes(4).toString("base64url").slice(0, 6);
  if (!guestName) return random;

  const slug = guestName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32);

  return slug ? `${slug}_${random}` : random;
}

/**
 * Link personal tamu memakai slug client sebagai subdomain (production):
 * https://<client-slug>.<domain>/<guest-token>
 * Di development (Turbopack), rewrite subdomain via proxy merusak hydration —
 * jadi lokal memakai format path yang selalu berfungsi:
 * http://localhost:3000/invite/<client-slug>/g/<token>
 */
export function generateInvitationUrl(
  appUrl: string,
  clientSlug: string,
  token: string
): string {
  const domain = process.env.NEXT_PUBLIC_INVITATION_DOMAIN;
  const isLocal = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
  if (domain && !isLocal) {
    const scheme = appUrl.startsWith("https") ? "https" : "http";
    return `${scheme}://${clientSlug}.${domain}/${token}`;
  }
  return `${appUrl}/invite/${clientSlug}/g/${token}`;
}
