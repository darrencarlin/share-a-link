"use client";

import { useMemo } from "react";

const CATEGORIES = [
  "article",
  "blog",
  "news",
  "video",
  "podcast",
  "music",
  "tool",
  "app",
  "library",
  "framework",
  "api",
  "documentation",
  "tutorial",
  "course",
  "book",
  "research",
  "paper",
  "reference",
  "social",
  "forum",
  "community",
  "shopping",
  "product",
  "deal",
  "entertainment",
  "game",
  "meme",
  "humor",
  "design",
  "inspiration",
  "portfolio",
  "startup",
  "business",
  "finance",
  "crypto",
  "ai",
  "machine-learning",
  "data-science",
  "devops",
  "security",
  "open-source",
  "job",
  "career",
  "event",
  "conference",
  "recipe",
  "health",
  "fitness",
  "travel",
  "science",
  "space",
  "politics",
  "environment",
  "education",
  "photography",
  "other",
];

type CategoryBarProps = {
  links: Array<{ category?: string | undefined }> | undefined;
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
};

export function CategoryBar({
  links,
  activeCategory,
  onCategoryChange,
}: CategoryBarProps) {
  const activeCategories = useMemo(() => {
    if (!links) return new Set<string>();
    const cats = new Set<string>();
    for (const link of links) {
      if (link.category) cats.add(link.category);
    }
    return cats;
  }, [links]);

  return (
    <div className="flex-shrink-0 border-b bg-muted/30">
      <div className="flex items-center gap-1.5 overflow-x-auto px-3 md:px-6 py-2 scrollbar-none">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          All{links ? ` (${links.length})` : ""}
        </button>
        {CATEGORIES.flatMap((cat) => {
          if (!activeCategories.has(cat)) return [];
          const count = links?.filter((l) => l.category === cat).length ?? 0;
          return (
            <button
              type="button"
              key={cat}
              onClick={() =>
                onCategoryChange(activeCategory === cat ? null : cat)
              }
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
