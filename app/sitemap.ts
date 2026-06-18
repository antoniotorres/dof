import type { MetadataRoute } from "next";

import { getNoteFiles } from "@/lib/aws";

const BASE_URL = "https://dof.toniotgz.com";

// Regenerate the sitemap at most once an hour.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [{ url: BASE_URL }];

  try {
    const files = await getNoteFiles();
    for (const file of files) {
      entries.push({
        url: `${BASE_URL}/notas/${file.id}`,
        lastModified: file.lastModified,
      });
    }
  } catch (error) {
    // Never fail the build/response over a sitemap; serve what we have.
    console.error(error);
  }

  return entries;
}
