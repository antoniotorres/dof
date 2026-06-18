import Image from "next/image";

export default function Header() {
  return (
    <header className="relative bg-white">
      <div className="relative z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-5 sm:px-6 sm:py-4 lg:px-8 md:justify-start md:space-x-10">
          <div>
            <span className="sr-only">Diario Oficial de la Fedaración</span>
            <Image
              src="/sello.png"
              alt="Sello de Mexico"
              width={40}
              height={40}
              priority
            />
          </div>
          <div>Diaro Oficial de la Fedaración</div>
        </div>
      </div>
    </header>
  );
}
