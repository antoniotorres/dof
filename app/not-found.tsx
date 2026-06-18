import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h3 className="text-center text-5xl leading-6 font-light text-gray-900 mt-20">
        404
      </h3>
      <h3 className="text-center text-lg leading-6 font-medium text-gray-800">
        Page Not Found
      </h3>
      <div className="mt-5 text-center">
        <Link
          href="/"
          className="uppercase no-underline inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-50 focus:outline-hidden focus:border-blue-300 focus:ring-2 focus:ring-blue-300 active:bg-blue-200 transition ease-in-out duration-150 sm:text-sm sm:leading-5"
        >
          Return to homepage
        </Link>
      </div>
    </>
  );
}
