const tags = require("../../../src/tags.js");
const processUrl = require("../../parcel-optimizer-website/processUrl");

function quot(text) {
  return text.replace("\"", "&quot;");
}

function missing(meta, attribute) {
  console.warn(`The article ${meta.parcelAssetPath} is missing '${attribute}'.`);
}

function renderGuideHeadElements(meta) {
  const parts = [];

  // check these fields as well, despite not being primarily rendered here
  // (but are used here)
  if (!meta.title) missing(meta, "title");
  if (!meta.titleHtml) missing(meta, "titleHtml");
  if (!meta.url) missing(meta, "url");

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
    .join(", ");
  parts.push(`<meta name="keywords" content="${quot(tagString)}">`);

  // author
  if (meta.author) {
    parts.push(`<meta name="author" content="${quot(meta.author)}">`);
  } else {
    missing(meta, "author");
  }

  // description
  if (meta.articleDescription) {
    parts.push(`<meta name="description" content="${quot(meta.articleDescription)}">`);
  } else {
    missing(meta, "articleDescription");
  }

  // === Social Media ===
  // https://css-tricks.com/essential-meta-tags-social-media/

  parts.push(`<!-- social media & Open Graph -->`);
  parts.push(`<meta property="og:type" content="article">`);
  parts.push(`<meta property="og:title" content="${quot(meta.title)}">`);
  if (meta.articleDescription) {
    parts.push(`<meta property="og:description" content="${quot(meta.articleDescription)}">`);
  }
  parts.push(`<meta property="og:url" content="${quot(processUrl("/" + meta.url))}">`);
  parts.push(`<meta property="og:site_name" content="Unisave">`);
  if (meta.image && meta.image !== "NO_IMAGE") {
    if (meta.image.endsWith("svg")) {
      console.warn(`OpenGraph does not support SVG images, in ${meta.parcelAssetPath}`);
    }

    // Parcel does recognise this tag as a URL dependency, so relative
    // paths should be used instead of finished URL addresses.
    // (but it does not recognise og:url for some reason...)
    parts.push(`<meta property="og:image" content="${quot(meta.image)}">`);
    parts.push(`<meta name="twitter:card" content="summary_large_image">`);
  } else {
    if (meta.image !== "NO_IMAGE") {
      missing(meta, "image");
    }
  }

  return parts.join("\n");
}

module.exports = renderGuideHeadElements;