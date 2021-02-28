import React from "react";

import Footer from "../../components/Footer";
import Header from "../../components/Header";
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

export async function getServerSideProps({ params: { id } }) {
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
