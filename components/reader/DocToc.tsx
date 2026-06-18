"use client";

import { useEffect, useState } from "react";

import type { TocItem } from "@/lib/toc";

export default function DocToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  function onClick(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="rounded-2xl border border-edge bg-white px-[22px] py-5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        En esta publicación
      </span>
      <nav className="mt-3 flex flex-col" aria-label="En esta publicación">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(event) => onClick(event, item.id)}
              style={{ paddingLeft: item.level >= 3 ? 24 : 12 }}
              className={`border-l-2 py-[7px] text-[13.5px] transition-colors ${
                isActive
                  ? "border-accent text-zinc-600"
                  : "border-line text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {item.text}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
