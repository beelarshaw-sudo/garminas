import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEMO_SUCCESS_STORIES, GUIDANCE_ARTICLES } from "@/lib/garminas";

export async function GET() {
  // published success stories — only those with explicit consent of both partners
  const published = await db.successStory.findMany({
    where: { status: "published", consentBoth: true },
    orderBy: { publishedAt: "desc" },
  });
  // If DB is empty, fall back to seed demo stories
  const all =
    published.length > 0
      ? published
      : DEMO_SUCCESS_STORIES.map((s) => ({
          id: s.id,
          partner1Name: s.partner1Name,
          partner2Name: s.partner2Name,
          story: s.story,
          photoUrl: null,
          introductionDate: s.introductionDate ? new Date(s.introductionDate) : null,
          publishedAt: s.publishedAt ? new Date(s.publishedAt) : null,
          status: "published",
          consentBoth: true,
          createdAt: new Date(),
        }));
  return NextResponse.json({ stories: all });
}
