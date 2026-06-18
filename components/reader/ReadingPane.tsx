"use client";

import { useState } from "react";

const MIN_SCALE = 0.8;
const MAX_SCALE = 1.5;
const STEP = 0.1;
const BASE_SIZE = 19;

export default function ReadingPane({
  content,
  title,
}: {
  content: string;
  title: string;
}) {
  const [scale, setScale] = useState(1);
  const [copied, setCopied] = useState(false);
  const [font, setFont] = useState<"serif" | "sans">("serif");

  const fontSize = Math.round(BASE_SIZE * scale * 10) / 10;

  async function share() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User dismissed the share sheet — nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; fail silently.
    }
  }

  return (
    <>
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-[10px] pb-[26px] pt-[18px]">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-4 py-[9px] text-[13.5px] font-semibold text-white transition hover:brightness-110"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          Descargar PDF
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-2 rounded-[10px] border border-edge px-[14px] py-[9px] text-[13.5px] text-zinc-700 transition hover:bg-[#f7f7f6]"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
          </svg>
          {copied ? "Enlace copiado" : "Compartir"}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <div
            role="group"
            aria-label="Tipo de letra"
            className="flex items-center gap-[2px] rounded-[10px] border border-edge p-[3px]"
          >
            {(["serif", "sans"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFont(option)}
                aria-pressed={font === option}
                className={`rounded-[7px] px-[10px] py-[6px] text-[12.5px] capitalize transition ${
                  font === option
                    ? "bg-field font-medium text-ink"
                    : "text-zinc-600 hover:bg-field"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-[2px] rounded-[10px] border border-edge p-[3px]">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(MIN_SCALE, s - STEP))}
              disabled={scale <= MIN_SCALE}
              aria-label="Reducir tamaño de texto"
              className="grid h-[30px] w-8 place-items-center rounded-[7px] text-[13px] text-zinc-600 transition hover:bg-field disabled:opacity-40"
            >
              A−
            </button>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(MAX_SCALE, s + STEP))}
              disabled={scale >= MAX_SCALE}
              aria-label="Aumentar tamaño de texto"
              className="grid h-[30px] w-8 place-items-center rounded-[7px] text-[17px] text-zinc-600 transition hover:bg-field disabled:opacity-40"
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        className="dof-prose"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily:
            font === "sans"
              ? "var(--font-public-sans), system-ui, sans-serif"
              : undefined,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}
