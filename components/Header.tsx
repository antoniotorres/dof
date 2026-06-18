"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { label: "Ediciones", href: "/notas" },
  { label: "Dependencias", href: "#" },
  { label: "Ayuda", href: "#" },
];

function SearchIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9a9a9f"
      strokeWidth={2.2}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const isHome = pathname === "/";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[#fdfdfc]/[0.82] backdrop-blur-xl backdrop-saturate-[1.8]">
      <div className="mx-auto flex h-[60px] max-w-[1180px] items-center gap-4 px-4 sm:gap-6 sm:px-7">
        <Link href="/" className="flex items-center gap-[11px]">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-accent text-[13px] font-bold tracking-[0.04em] text-white">
            DOF
          </span>
          <span className="flex flex-col text-left leading-[1.1]">
            <span className="text-[14.5px] font-semibold tracking-[-0.01em]">
              Diario Oficial
            </span>
            <span className="text-[11px] tracking-[0.01em] text-zinc-500">
              de la Federación
            </span>
          </span>
        </Link>

        {!isHome && (
          <form
            onSubmit={onSubmit}
            role="search"
            className="mx-auto hidden max-w-[420px] flex-1 sm:block"
          >
            <div className="flex h-[38px] items-center gap-[9px] rounded-[10px] border border-edge bg-field px-[14px] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
              <SearchIcon />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar publicaciones"
                aria-label="Buscar publicaciones"
                className="min-w-0 flex-1 border-none bg-transparent text-[14px] text-ink placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
          </form>
        )}

        <nav className="ml-auto flex items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-[13px] py-2 text-[13.5px] text-zinc-600 transition-colors hover:bg-field"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="ml-2 rounded-[9px] bg-accent px-4 py-2 text-[13.5px] font-semibold text-white transition hover:brightness-110"
          >
            Suscribirse
          </button>
        </nav>
      </div>
    </header>
  );
}
