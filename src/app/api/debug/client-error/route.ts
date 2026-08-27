import { apiSuccess } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  console.error("[CLIENT-ERROR]", JSON.stringify(body));
  return apiSuccess({ ok: true });
}
