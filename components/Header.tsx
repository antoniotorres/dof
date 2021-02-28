import React from "react";

export default function Header() {
  return (
    <div className="relative bg-white">
      <div className="relative z-20 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-5 sm:px-6 sm:py-4 lg:px-8 md:justify-start md:space-x-10">
          <div>
            <span className="sr-only">Diario Oficial de la Fedaración</span>
            <img
              className="h-8 w-auto sm:h-10"
              src="/sello.png"
              alt="Sello de Mexico"
            />
          </div>
          <div>Diaro Oficial de la Fedaración</div>
        </div>
      </div>
    </div>
  );
}
