require("isomorphic-fetch");
const fs = require("fs");
const prettier = require("prettier");
const dateFNS = require("date-fns");
const AWS = require("aws-sdk");

// Load S3 with env variables
const s3 = new AWS.S3({
  region: process.env.SERVER_AWS_REGION,
  accessKeyId: process.env.SERVER_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.SERVER_AWS_ACCESS_SECRET,
});

async function listObjectsBucket() {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.SERVER_AWS_BUCKET,
    };
    s3.listObjects(params, (s3Err, data) => {
      if (s3Err) reject(s3Err);
      resolve(data);
    });
  });
}

async function getFiles() {
  const list = await listObjectsBucket();
  return list.Contents;
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
                              ".php",
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
