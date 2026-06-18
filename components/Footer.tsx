const FOOTER_LINKS = [
  { label: "Accesibilidad", href: "#" },
  { label: "Términos", href: "#" },
  { label: "Contacto", href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-[#fafafa]">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-6 px-4 py-10 sm:px-7">
        <div className="flex items-center gap-[11px]">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-accent text-[11.5px] font-bold text-white">
            DOF
          </span>
          <span className="text-[13px] text-zinc-400">
            Diario Oficial de la Federación · Concepto de rediseño
          </span>
        </div>
        <div className="flex gap-[22px] text-[13px] text-zinc-500">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
