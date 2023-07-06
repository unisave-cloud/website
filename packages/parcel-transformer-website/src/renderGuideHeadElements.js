function renderGuideHeadElements(meta) {
  const parts = [];

  // don't index non-published articles
  if (!meta.datePublished) {
    parts.push(`<meta name="robots" content="noindex">`);
  }

  // the atricle canonical URL
  parts.push(`<link rel="canonical" href="${meta.parcelAssetPath}">`);
  
  return parts.join("\n");
}

module.exports = renderGuideHeadElements;