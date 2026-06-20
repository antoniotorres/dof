require("isomorphic-fetch");
const fs = require("fs");
const prettier = require("prettier");
const dateFNS = require("date-fns");
const {
  S3Client,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");

// R2 is S3-compatible; credentials and endpoint come from env vars.
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function getFiles() {
  const output = await r2.send(
    new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET }),
  );
  return output.Contents;
}

(async () => {
  const prettierConfig = await prettier.resolveConfig("./.prettierrc.js");

  // Get data from folder /content
  const pages = await getFiles();

  const sitemap = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
              <loc>${`https://dof.toniotgz.com`}</loc>
          </url>
            ${pages
              .map((page) => {
                return `
                        <url>
                            <loc>${`https://dof.toniotgz.com/notas/${page.Key.replace(
                              ".json",
                              "",
                            )}`}</loc>
                            <lastmod>${dateFNS.format(
                              page.LastModified,
                              "yyyy-MM-dd",
                            )}</lastmod>
                        </url>
                    `;
              })
              .join("")}
        </urlset>
    `;

  // If you're not using Prettier, you can remove this.
  const formatted = prettier.format(sitemap, {
    ...prettierConfig,
    parser: "html",
  });

  fs.writeFileSync("public/sitemap.xml", formatted);
})();
