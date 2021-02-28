import React from "react";

import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { getFiles } from "../../lib/aws";
import { getNote } from "../../lib/getNote";

interface Props {
  post: any;
}

export default function Page({ post }: Props) {
  return (
    <div className="flex flex-col items-stretch min-h-screen">
      <Header />
      <article className="w-full mx-auto flex-grow max-w-screen-lg py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div dangerouslySetInnerHTML={{ __html: post }} />
      </article>
      <Footer />
    </div>
  );
}

// This function gets called at build time
export async function getStaticPaths() {
  // Call an external API endpoint to get posts
  const files = await getFiles();

  // // Get the paths we want to pre-render based on posts
  const paths = files.map((file) => ({
    params: { id: file.Key.replace(".php", "") },
  }));

  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: true };
}

export async function getStaticProps({ params: { id } }) {
  try {
    const post = await getNote(id);
    return {
      props: {
        post,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      notFound: true,
    };
  }
}
