export interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string, used: Set<string>): string {
  const base =
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "seccion";

  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

/**
 * Build a table of contents from the `<h1>`–`<h3>` headings in a note's HTML,
 * injecting a stable `id` on each so the sidebar can link and scroll to it.
 * Returns the (possibly rewritten) html and the heading list. If a document
 * has no headings the toc is empty and the sidebar card is simply omitted.
 */
export function buildToc(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>();

  const rewritten = html.replace(
    /<(h[1-3])\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag: string, attrs: string, inner: string) => {
      const text = inner
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!text) return match;

      const id = slugify(text, used);
      toc.push({ id, text, level: Number(tag[1]) });

      // Replace any existing id, then inject ours.
      const cleanedAttrs = attrs.replace(/\s*id\s*=\s*("[^"]*"|'[^']*')/i, "");
      return `<${tag}${cleanedAttrs} id="${id}">${inner}</${tag}>`;
    },
  );

  return { html: rewritten, toc };
}
