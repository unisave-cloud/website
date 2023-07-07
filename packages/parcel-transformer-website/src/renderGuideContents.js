const TextualContent = require("./TextualContent");

function getTagDepth(tag) {
  if (tag === "h2")
    return 2;
  if (tag === "h3")
    return 3;
  if (tag === "h4")
    return 4;
  throw new Error("Unsupported tag " + tag)
}

/**
 * @param {TextualContent} textualContent 
 * @returns 
 */
function renderGuideContents(textualContent) {
  const parts = [];
  let depth = 2

  for (const section of textualContent.sections) {
    if (section.tag === null) {
      continue; // skip the pre-section
    }
    
    const thisDepth = getTagDepth(section.tag);
    while (depth < thisDepth) {
      parts.push("<ol>");
      depth += 1;
    }
    while (depth > thisDepth) {
      parts.push("</ol>");
      depth -= 1;
    }

    parts.push(`<li><a href="#${section.id}">${section.title}</a></li>`);
  }

  while (depth > 2) {
    parts.push("</ol>");
    depth -= 1;
  }
  
  return parts.join("\n");
}

module.exports = renderGuideContents;