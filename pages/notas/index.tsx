import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col items-stretch min-h-screen">
      <Header />
      <div className="flex-grow max-w-screen-lg mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        Próximamente más
      </div>
      <Footer />
    </div>
  );
}
