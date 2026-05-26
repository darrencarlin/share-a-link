import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import BoardPage from "./board-page";

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;

  const board = await fetchQuery(api.boards.getByShortCode, {
    shortCode: code,
  });

  if (!board) {
    return {
      title: "Board not found — Share a Link",
      description: "This board doesn't exist.",
    };
  }

  const links = await fetchQuery(api.links.listByBoard, {
    boardId: board._id,
  });

  const linkCount = links.length;
  const categories = [...new Set(links.flatMap((l) => l.category ? [l.category] : []))];
  const topCategories = categories.slice(0, 5).join(", ");

  const description =
    linkCount === 0
      ? `${board.name} — a curated link board. Paste any URL and AI organizes it.`
      : `${linkCount} link${linkCount === 1 ? "" : "s"} curated by AI${topCategories ? ` across ${topCategories}` : ""}. Paste a URL to add more.`;

  return {
    title: `${board.name} — Share a Link`,
    description,
    openGraph: {
      title: `${board.name} — Share a Link`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${board.name} — Share a Link`,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { code } = await params;
  return <BoardPage code={code} />;
}
