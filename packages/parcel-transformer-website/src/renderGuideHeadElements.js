const tags = require("../../../src/tags.js");

function renderGuideHeadElements(meta) {
  const parts = [];

  // comment
  parts.push(`<!-- guide head elements -->`);

  // don't index non-published articles
  if (!meta.datePublished) {
    parts.push(`<meta name="robots" content="noindex">`);
  }

  // the atricle canonical URL
  parts.push(`<link rel="canonical" href="${meta.parcelAssetPath}">`);

  // keywords
  const tagString = meta.tags.map(tagId => {
    const tag = tags.filter(t => t.id === tagId)[0];
    if (!tag || !tag.title) return undefined;
    return tag.title;
  })
    .filter(t => t !== undefined)
    .join(", ")
    .replace("\"", "&quot;");
  parts.push(`<meta name="keywords" content="${tagString}">`);

  // author
  if (meta.author) {
    const authorString = meta.author.replace("\"", "&quot;");
    parts.push(`<meta name="author" content="${authorString}">`);
  }
  
  return parts.join("\n");
}

module.exports = renderGuideHeadElements;