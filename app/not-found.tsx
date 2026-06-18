import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[600px] flex-col items-center px-7 py-32 text-center">
      <span className="font-serif text-[64px] font-semibold leading-none tracking-[-0.02em] text-accent">
        404
      </span>
      <h1 className="mt-4 font-serif text-[22px] font-semibold tracking-[-0.01em]">
        Página no encontrada
      </h1>
      <p className="mt-2 text-[15px] text-zinc-500">
        No encontramos la publicación que buscas. Puede que el enlace haya
        cambiado o que el documento ya no esté disponible.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-[10px] bg-accent px-5 py-[10px] text-[14px] font-semibold text-white transition hover:brightness-110"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
