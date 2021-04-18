function minify(content: string) {
  return content.replace(/  |\r\n|\n|\r/gm, "");
}

function wrapTable(content: string) {
  const replaced = content.replace(
    /(<table.*?<\/table>)/gm,
    '<div class="overflow-scroll">$1</div>',
  );
  return replaced;
}

function replaceChars(content: string) {
  let replaced = content.replace(/<CHAR: 8220\/>/gm, "Ó");
  replaced = replaced.replace(/<CHAR: 8240\/>/gm, "É");
  replaced = replaced.replace(/<CHAR: 141\/>/gm, "Í");
  replaced = replaced.replace(/<CHAR: 8211\/>/gm, "");
  replaced = replaced.replace(/<CHAR: 732\/>/gm, "");
  return replaced;
}

function getContent(page: string) {
  const content = page.split("<BODY>")[1].split("</BODY>")[0];
  return content;
}

function sanitizeStyles(content: string) {
  let replaced = content.replace(/font-family:.*?;/gm, "");
  replaced = replaced.replace(/style='font-family:Helvetica;'/gm, "");
  replaced = replaced.replace(/text-indent:.*?;/gm, "");
  replaced = replaced.replace(/margin-left:0.0pt;/gm, "");
  replaced = replaced.replace(/white-space:.*?;/gm, "");
  return replaced;
}

export function sanitizeHTML(content: string) {
  let modContent = replaceChars(content);
  modContent = getContent(modContent);
  modContent = sanitizeStyles(modContent);
  modContent = wrapTable(modContent);
  modContent = minify(modContent);
  return modContent;
}

export function removeTags(str: string) {
  if (str === null || str === "") return "";
  else str = str.toString();
  return str.replace(/(<([^>]+)>)/gi, "");
}
