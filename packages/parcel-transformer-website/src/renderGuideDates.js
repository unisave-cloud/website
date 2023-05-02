function renderDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderPublishedOn(datePublished) {
  if (!datePublished)
    return "Not published yet";
  
  return "Published on " + renderDate(datePublished);
}

function renderUpdatedOn(dateUpdated) {
  if (!dateUpdated)
    return null;
  
  return "Updated on " + renderDate(dateUpdated);
}

function renderReadTime(textualContent) {
  const wordsPerMinute = 150; // slow, coz complex
  const minutes = Math.ceil(textualContent.wordCount / wordsPerMinute);
  return minutes + " min read";
}

function renderGuideDates(meta, textualContent) {
  const parts = [
    renderPublishedOn(meta.datePublished),
    renderUpdatedOn(meta.dateUpdated),
    renderReadTime(textualContent)
  ].filter(p => !!p);

  return parts.join(` &nbsp; • &nbsp; `);
}

module.exports = renderGuideDates;