const { marked } = require("marked");
const yaml = require("js-yaml");
const { parse: parseHtml } = require("node-html-parser");

class ArticlePage {
  constructor(contents) {
    this.markdownBody = contents;
    
    this.yamlHeader = null;
    this.parseYamlHeader();

    this.htmlBody = marked.parse(this.markdownBody);
    this.header = this.yamlHeader ? yaml.load(this.yamlHeader) : {};

    this.domBody = parseHtml(this.htmlBody);

    // TODO: extract ToC

    // TODO: extract lunr headings, sections and build the index

    // TODO: render given template by replacing keyword terms

    this.addHeaderAnchors();
    this.addTitle();
  }

  parseYamlHeader() {
    const contents = this.markdownBody;
    if (contents.startsWith("---\n")) {
      let i = contents.indexOf("---\n", 4);
      if (i > 0) {
        this.yamlHeader = contents.substring(4, i);
        this.markdownBody = contents.substring(i + 4);
      }
    }
  }

  addHeaderAnchors() {
    const headers = this.domBody.querySelectorAll("h2, h3, h4");

    for (const header of headers) {
      let id = header.getAttribute("id")
      header.replaceWith(`<a name="${id}"></a>\n`, header, "\n")
      header.removeAttribute("id");
    }
  }

  addTitle() {
    const title = this.header.title;
    
    if (!title)
      return;

    const firstNode = this.domBody.firstChild;
    firstNode.replaceWith(
      `<h1>${title}</h1>\n\n`,
      firstNode
    );
  }

  buildOutputHtml() {
    // TODO: render into a template
    return this.domBody.outerHTML;
  }

  buildArticlePageMeta() {
    return {
      header: this.header,

      title: this.header.title || "Untitled article",
      url: this.header.url || "untitled-article",
      tags: this.header.tags || [],
      author: this.header.author || null,
      date: this.header.date || null
    }
  }
}

module.exports = ArticlePage;
