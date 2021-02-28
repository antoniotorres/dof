import { AppProps } from "next/app";

// Import tailwind into all pages
import "../styles/tailwind.css";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
