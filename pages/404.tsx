import Link from "next/link";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Page() {
  return (
    <div className="flex flex-col items-stretch min-h-screen">
      <Header />
      <div className="flex-grow max-w-screen-lg mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <h3 className="text-center text-5xl leading-6 font-light text-gray-900 mt-20">
          404
        </h3>
        <h3 className="text-center text-lg leading-6 font-medium text-gray-800">
          Page Not Found
        </h3>
        <div className="mt-5 text-center">
          <Link href="/" passHref>
            <a
              type="button"
              className="uppercase no-underline inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-50 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-blue-200 transition ease-in-out duration-150 sm:text-sm sm:leading-5"
            >
              Return to homepage
            </a>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
