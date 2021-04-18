import { format, parseISO } from "date-fns";
import { ArticleJsonLd, NextSeo } from "next-seo";
import { useRouter } from "next/router";
import React from "react";

import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { getFiles } from "../../lib/aws";
import { getNote } from "../../lib/getNote";
import { removeTags } from "../../lib/sanitize";

interface Props {
  post: { metadata: { title: string; published_at: string }; content: string };
}

export default function Page({ post }: Props) {
  const router = useRouter();
  const { id } = router.query;

  if (!post) {
    return (
      <div className="flex flex-col items-stretch min-h-screen">
        <Header />
        <article className="w-full mx-auto flex-grow max-w-screen-lg py-12 px-4 overflow-hidden sm:px-6 lg:px-8"></article>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch min-h-screen">
      <NextSeo
        title={`DOF | ${post.metadata.title.substring(0, 60)}`}
        canonical={`https://dof.toniotgz.com/notas/${id}`}
        openGraph={{
          url: `https://dof.toniotgz.com/notas/${id}`,
          title: `DOF | ${post.metadata.title.substring(0, 60)}`,
        }}
      />
      <ArticleJsonLd
        url={`https://dof.toniotgz.com/notas/${id}`}
        title={`DOF | ${post.metadata.title.substring(0, 60)}`}
        images={["https://dof.toniotgz.com/apple-touch-icon.png"]}
        datePublished={post.metadata.published_at}
        dateModified={post.metadata.published_at}
        authorName={["Gobierno de Mexico"]}
        publisherName="Gobierno de Mexico"
        publisherLogo="https://dof.toniotgz.com/apple-touch-icon.png"
        description={removeTags(post.content.substring(0, 512)).trim()}
      />
      <Header />
      <article className="w-full mx-auto flex-grow max-w-screen-lg py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div>
          Fecha: {format(parseISO(post.metadata.published_at), "dd/MM/yyyy")}
        </div>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
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
    params: { id: file.Key.replace(".json", "") },
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
