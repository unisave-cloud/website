function renderGuideHeadElements(meta) {
  const parts = [];

  // don't index non-published articles
  if (!meta.datePublished) {
    parts.push(`<meta name="robots" content="noindex">`);
  }
  
  return parts.join("\n");
}

module.exports = renderGuideHeadElements;