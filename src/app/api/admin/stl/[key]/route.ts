import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrivateObjectStream } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Forbidden", { status: 403 });

  const { key } = await ctx.params;
  const got = await getPrivateObjectStream(decodeURIComponent(key));
  if (!got) return new NextResponse("Not found", { status: 404 });
  // @ts-expect-error Node Readable to Web stream
  return new NextResponse(got.stream, {
    headers: {
      "Content-Type": got.contentType,
      "Content-Disposition": "attachment",
      "Cache-Control": "no-store",
    },
  });
}
