import { conservativeMaxAgeSeconds, parseSlugCsv, serializeSlugCsv, viewedCookieNameToday } from "@/utils/viewedArticles";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  const { slug } = (await req.json().catch(() => ({}))) as { slug?: string };
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ ok: false, error: "Invalid slug" }, { status: 400 });
  }

  const cookieName = viewedCookieNameToday();
  const existing = req.cookies.get(cookieName)?.value;
  const ids = parseSlugCsv(existing);
  ids.add(slug);

  const value = serializeSlugCsv(ids);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: conservativeMaxAgeSeconds(),
  });
  return res;
}
