import { NextRequest, NextResponse } from "next/server";
import {
  conservativeMaxAgeSeconds,
  parseSlugCsv,
  serializeSlugCsv,
  viewedCookieNameToday,
} from "@/utils/viewedArticles";

const MAX_SLUGS_PER_DAY = 64;
const MAX_SLUG_LENGTH = 128;
const SLUG_REGEX = /^[a-z0-9-]+$/;

export async function POST(req: NextRequest) {
  // 1) Require JSON to mitigate CSRF via simple forms
  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Content-Type must be application/json" }, { status: 415 });
  }

  // 2) Parse body safely
  const body = (await req.json().catch(() => null)) as { slug?: string } | null;
  const slug = body?.slug;
  if (typeof slug !== "string") {
    return NextResponse.json({ ok: false, error: "Invalid slug" }, { status: 400 });
  }

  // 3) Validate slug format and length
  if (slug.length === 0 || slug.length > MAX_SLUG_LENGTH || !SLUG_REGEX.test(slug)) {
    return NextResponse.json({ ok: false, error: "Slug not allowed" }, { status: 400 });
  }

  // 4) Load existing cookie and enforce cap
  const cookieName = viewedCookieNameToday();
  const existing = req.cookies.get(cookieName)?.value;
  const ids = parseSlugCsv(existing);

  if (!ids.has(slug)) {
    if (ids.size >= MAX_SLUGS_PER_DAY) {
      return NextResponse.json({ ok: true, capped: true, count: ids.size }, { status: 200 });
    }
    ids.add(slug);
  }

  const value = serializeSlugCsv(ids);

  // 5) Set hardened cookie flags
  const res = NextResponse.json({ ok: true, count: ids.size });
  res.cookies.set(cookieName, value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: conservativeMaxAgeSeconds(),
  });
  return res;
}
