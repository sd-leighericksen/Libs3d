import { NextResponse } from "next/server";
import { getPublicObjectStream } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const { key } = await ctx.params;
  const joined = key.join("/");
  const got = await getPublicObjectStream(joined);
  if (!got) return new NextResponse("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type":
      joined.endsWith(".stl")
        ? "application/sla"
        : got.contentType,
    "Cache-Control": "public, max-age=3600",
  });
  // @ts-expect-error Node Readable to Web stream
  return new NextResponse(got.stream, { headers });
}
