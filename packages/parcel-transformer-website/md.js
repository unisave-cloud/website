const { Transformer } = require("@parcel/plugin");
const { marked } = require("marked");
const path = require("path");
const yaml = require("js-yaml");

function parseMarkdownFile(contents) {
  let yamlHeader = null;
  let markdownBody = contents;
  
  if (contents.startsWith("---\n")) {
    let i = contents.indexOf("---\n", 4);
    if (i > 0) {
      yamlHeader = contents.substring(4, i);
      markdownBody = contents.substring(i + 4);
    }
  }
  
  const htmlBody = marked.parse(markdownBody);
  const header = yamlHeader ? yaml.load(yamlHeader) : {};

  const articlePage = {
    header: header,

    title: header.title || "Untitled article",
    url: header.url || "untitled-article",
    tags: header.tags || [],
    author: header.author || null,
    date: header.date || null
  };

  return {
    htmlBody,
    articlePage
  }
}

exports.default = new Transformer({
  async transform({ asset, options }) {
    
    asset.type = "html";

    const templatePath = path.join(options.projectRoot, "src/docs/_template.html");
    const templateHtml = await options.inputFS.readFile(templatePath, "utf-8");

    asset.invalidateOnFileChange(templatePath);

    const { htmlBody, articlePage } = parseMarkdownFile(
      await asset.getCode()
    );

    const pageHtml = templateHtml.replace("@docBody", htmlBody);
    
    asset.setCode(pageHtml);

    asset.meta.articlePage = articlePage;

    return [asset];
  }
});
