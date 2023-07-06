const tags = require("../../../src/tags.js");

function renderGuideTags(meta) {
  const parts = []

  for (let tagId of meta.tags) {
    const tag = tags.filter(t => t.id === tagId)[0];
    
    if (!tag)
      continue;
    
    parts.push(`<a class="guide-tag" href="#">${tag.title}</a>`);
  }

  return parts.join("\n");
}

module.exports = renderGuideTags;