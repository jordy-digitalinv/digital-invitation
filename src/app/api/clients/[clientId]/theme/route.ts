import { canAccessClient, canAccessGuestPhotos, requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TEMPLATE_SLUGS = [
  "classic-elegant",
  "modern-minimal",
  "floral-blush",
  "luxe-darkgold",
  "sage-botanical",
  "rustic-terracotta",
  "jawa-ageng",
  "ambon-manise",
  "islami-emerald",
  "sangjit-merah",
  "minang-gadang",
  "batak-ulos",
  "hanoi-modern",
  "lucky-envelope",
] as const;

const themeSchema = z.object({
  templateSlug: z.enum(TEMPLATE_SLUGS).optional(),
  primaryColor: z.string().min(1).optional(),
  secondaryColor: z.string().min(1).optional(),
  bgColor: z.string().min(1).optional(),
  textColor: z.string().min(1).optional(),
  fontHeading: z.string().min(1).optional(),
  fontBody: z.string().min(1).optional(),
  customCss: z.string().optional(),
  showCountdown: z.boolean().optional(),
  showMap: z.boolean().optional(),
  autoScroll: z.boolean().optional(),
  barcodeVisibility: z.enum(["ALWAYS", "AFTER_RSVP", "HIDDEN"]).optional(),
  barcodeMode: z.enum(["SINGLE", "SEPARATE"]).optional(),
  disposableCameraEnabled: z.boolean().optional(),
});

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const theme = await prisma.theme.findUnique({ where: { clientId } });
    return apiSuccess(theme);
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const body = await req.json();
    const parsed = themeSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    if (parsed.data.disposableCameraEnabled !== undefined && !(await canAccessGuestPhotos(clientId))) {
      delete parsed.data.disposableCameraEnabled;
    }

    const theme = await prisma.theme.upsert({
      where: { clientId },
      update: parsed.data,
      create: { clientId, ...parsed.data },
    });

    // Bust invitation page cache after theme update
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { slug: true },
    });
    if (client?.slug) {
      revalidatePath(`/invite/${client.slug}`);
      revalidatePath(`/invite/${client.slug}/g/[token]`);
    }

    return apiSuccess(theme);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}
