import { NextRequest, NextResponse } from "next/server";
import { GUIDANCE_ARTICLES } from "@/lib/garminas";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (slug) {
    const article = GUIDANCE_ARTICLES.find((a) => a.slug === slug);
    if (!article) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    return NextResponse.json({
      article: {
        ...article,
        body: guidanceBody(article.slug),
      },
    });
  }
  return NextResponse.json({ articles: GUIDANCE_ARTICLES });
}

function guidanceBody(slug: string): string {
  const bodies: Record<string, string> = {
    "preparing-profile":
      "An honest, well-structured matrimonial profile is the foundation of meaningful introductions on GarMinas. Begin with a clear, recent photograph that you are comfortable sharing with serious, verified members. In your About Me, describe who you are today, the values that guide your life, and what you hope to build with a future spouse. Avoid exaggeration and avoid disclosing sensitive contact or location details. Complete the structured fields — education, profession, family background, languages — so members can assess compatibility respectfully. Review your preferences thoughtfully: narrower preferences are not necessarily better. The platform never requires you to share more than you are comfortable with.",
    "respectful-communication":
      "Every conversation on GarMinas begins with the understanding that marriage is a serious commitment. Address the other person by name. Avoid pressing for personal contact information before an introduction has been mutually agreed. Listen actively. Ask thoughtful questions about values, daily life, and family expectations. If you decide the connection is not right, communicate your decision respectfully and withdraw the proposal through the proposal manager — you are never required to share a reason, and you should never pressure the other member for one.",
    "understanding-compatibility":
      "GarMinas provides a transparent, rules-based compatibility summary that compares the preferences you have declared with the attributes another member has declared. It tells you which declared preferences align. It does not predict whether a marriage will succeed, and it does not infer personality, character, religious sincerity, or worth from your name, location, profession, or appearance. Compatibility is a starting point for a respectful conversation, not a verdict. Two people whose preferences align on paper must still discover whether their values, communication, and life goals truly fit.",
    "family-discussions":
      "In our community, marriage is often a family decision as much as an individual one. GarMinas supports optional family involvement through trusted, authorized representatives with limited permissions. Before involving family, talk openly with the other member about who will participate and what role they will play. Family members can help gather information, ask practical questions, and share perspectives — but the decision to marry belongs to the two people considering it. Treat family involvement as a source of wisdom, not as a substitute for honest, direct conversation.",
    "privacy-online-safety":
      "Protect your personal information throughout the matchmaking process. Do not share your residential address, financial details, or copies of identity documents through chat. Use GarMinas's privacy centre to control who can view your photographs and profile, and to temporarily hide your profile when you need a break. Block and report any member who pressures you for money, requests sensitive documents, or behaves inappropriately. GarMinas never sells member information, and never uses member photographs for marketing or AI training without separate explicit consent.",
    "recognizing-fraud":
      "Matrimonial fraud is a real and serious threat. Be cautious of any member who: requests money for any reason, including travel, visas, medical emergencies, or 'investments'; pressures you to move the conversation off-platform to encrypted messaging apps before you have built trust; claims a sudden emergency requiring your financial help; sends inconsistent information about their identity, profession, or family; refuses to verify their identity or community eligibility. If you encounter any of these signs, cease communication immediately, decline or withdraw the proposal, and file a confidential report through the Safety Centre. GarMinas investigates every report and may permanently ban members found to be engaging in fraud.",
  };
  return bodies[slug] ?? "";
}
