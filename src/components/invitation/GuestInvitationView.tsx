import { getGuestByToken, markGuestOpened } from "@/modules/guests/guests.service";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getDeviceType } from "@/lib/utils";
import { TemplateRenderer } from "@/components/invitation/TemplateRenderer";
import { ClientErrorLogger, InvitationErrorBoundary } from "@/components/invitation/debug/ClientErrorLogger";
import { DisposableCamera } from "@/components/invitation/sections/DisposableCamera";

const LUCKY_ENVELOPE_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Jost:wght@300;400;500;600&family=Cinzel:wght@400;500&display=swap";

export async function GuestInvitationView({ token }: { token: string }) {
  const guest = await getGuestByToken(token);
  if (!guest || !guest.isActive) notFound();
  if (guest.client.status !== "ACTIVE") notFound();

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "";
  const ua = headersList.get("user-agent") || "";
  markGuestOpened(guest.id, guest.client.id, ip, ua, getDeviceType(ua)).catch(() => {});

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={LUCKY_ENVELOPE_FONT_URL} rel="stylesheet" />
    <ClientErrorLogger>
      <InvitationErrorBoundary>
      <TemplateRenderer
        guest={{
          id: guest.id,
          name: guest.name,
          maxPax: guest.maxPax,
          rsvp: guest.rsvp,
          invitationCategory: guest.invitationCategory as "GEREJA_SAJA" | "GEREJA_RESEPSI",
          barcodeChurch: guest.barcodeChurch,
          barcodeReception: guest.barcodeReception,
        }}
        client={guest.client as any}
        token={token}
      />
      <DisposableCamera
        token={token}
        clientId={guest.client.id}
        guestName={guest.name}
        rsvpStatus={guest.rsvp?.status ?? null}
        hasCheckedIn={guest.attendances.length > 0}
        barcodeVisibility={guest.client.theme?.barcodeVisibility ?? "AFTER_RSVP"}
        enabled={guest.client.theme?.disposableCameraEnabled ?? true}
        eventDates={guest.client.events
          .filter((e) => e.date)
          .map((e) => new Date(e.date as Date).toISOString())}
      />
      </InvitationErrorBoundary>
    </ClientErrorLogger>
    </>
  );
}

function getEventLabel(clientType: string, lang: "id" | "en"): string {
  if (lang === "en") {
    if (clientType === "SANGJIT") return "Sangjit";
    if (clientType === "LAMARAN") return "Engagement";
    return "Wedding";
  }
  if (clientType === "SANGJIT") return "Sangjit";
  if (clientType === "LAMARAN") return "Lamaran";
  return "Pernikahan";
}

export async function getGuestInvitationMetadata(token: string, lang: "id" | "en" = "id") {
  const guest = await getGuestByToken(token);
  if (!guest) return {};

  const profile = guest.client.weddingProfile;
  const eventLabel = getEventLabel(guest.client.clientType, lang);
  const coupleNames = profile
    ? `${profile.groomName} & ${profile.brideName}`
    : guest.client.name;

  const title = lang === "en"
    ? `${eventLabel} Invitation - ${coupleNames}`
    : `Undangan ${eventLabel} ${coupleNames}`;
  const description = lang === "en"
    ? `You're invited to ${coupleNames}'s ${eventLabel.toLowerCase()}`
    : `Anda diundang ke acara ${eventLabel.toLowerCase()} ${coupleNames}`;

  const galleries = (guest.client as { galleries?: { type: string; isCover: boolean; url: string }[] }).galleries;
  const cover = galleries?.find((g) => g.type === "HERO" || g.isCover) ?? galleries?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: cover ? [{ url: cover.url }] : undefined,
    },
  };
}
