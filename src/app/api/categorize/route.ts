import { fetchAction } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export async function POST(request: Request) {
  const { linkId } = (await request.json()) as { linkId: string };

  await fetchAction(api.links.categorize, {
    linkId: linkId as Id<"links">,
  });

  return Response.json({ ok: true });
}
