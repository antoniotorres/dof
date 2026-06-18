"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { DocCard } from "@/lib/sampleDocs";

const LISTBOX_ID = "dof-search-suggestions";

function SearchIcon({
  size,
  color,
  width = 2.1,
}: {
  size: number;
  color: string;
  width?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function HeroSearch({
  docs,
  initialQuery = "",
}: {
  docs: DocCard[];
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl-K focuses the search, matching the keyboard hint.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // When arriving with a URL query (e.g. from the header search), focus the
  // input so the suggestions are visible. The parent remounts this component
  // via `key={initialQuery}`, so `useState(initialQuery)` already seeds the
  // text — no state sync needed here.
  useEffect(() => {
    if (initialQuery) inputRef.current?.focus();
  }, [initialQuery]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return docs
      .filter((doc) =>
        `${doc.titulo} ${doc.dependencia ?? ""} ${doc.tipo}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 6);
  }, [docs, query]);

  const showSuggestions = focused && suggestions.length > 0;
  const activeId =
    showSuggestions && activeIndex >= 0
      ? `${LISTBOX_ID}-${activeIndex}`
      : undefined;

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      const target = suggestions[activeIndex >= 0 ? activeIndex : 0];
      if (target) {
        event.preventDefault();
        router.push(`/notas/${target.id}`);
      }
    } else if (event.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative mx-auto max-w-[600px]">
      <div className="flex h-[60px] items-center gap-[13px] rounded-2xl border border-[#e2e2e0] bg-white px-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_28px_rgba(0,0,0,0.05)] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
        <SearchIcon size={21} color="#9a9a9f" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setFocused(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 130)}
          onKeyDown={onKeyDown}
          placeholder="Busca por tema, dependencia o número de documento…"
          aria-label="Buscar publicaciones"
          className="min-w-0 flex-1 border-none bg-transparent text-[17px] text-ink placeholder:text-zinc-500 focus:outline-none"
        />
        <kbd className="hidden rounded-md border border-edge px-[7px] py-[3px] text-[11px] text-zinc-400 sm:block">
          ⌘K
        </kbd>
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-[70px] z-30 animate-[sugIn_0.16s_ease] overflow-hidden rounded-[14px] border border-line bg-white text-left shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          <div className="px-[18px] pb-[6px] pt-[10px] text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
            Sugerencias
          </div>
          <ul id={LISTBOX_ID} role="listbox" aria-label="Sugerencias">
            {suggestions.map((doc, index) => (
              <li
                key={doc.id}
                id={`${LISTBOX_ID}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
              >
                <Link
                  href={`/notas/${doc.id}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center gap-[13px] px-[18px] py-[11px] text-left ${
                    index === activeIndex ? "bg-[#f7f7f6]" : ""
                  }`}
                >
                  <SearchIcon size={16} color="#bfbfc4" width={2} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-zinc-800">
                      {doc.titulo}
                    </span>
                    <span className="block text-[12px] text-zinc-400">
                      {doc.dependencia ?? doc.tipo}
                    </span>
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#cfcfd4"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
