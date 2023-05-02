const { marked } = require("marked");
const yaml = require("js-yaml");
const { parse: parseHtml } = require("node-html-parser");
const TextualContent = require("./TextualContent");
const renderGuideDates = require("./renderGuideDates");

class ArticlePage {
  constructor(contents) {
    this.markdownBody = contents;
    
    this.yamlHeader = null;
    this.parseYamlHeader();

    this.htmlBody = marked.parse(this.markdownBody);
    this.header = this.yamlHeader ? yaml.load(this.yamlHeader) : {};

    this.domBody = parseHtml(this.htmlBody);

    this.textualContent = new TextualContent(this.domBody);

    // TODO: extract ToC

    // TODO: build the lunr index

    this.formatHeadings();
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

  formatHeadings() {
    const headers = this.domBody.querySelectorAll("h2, h3, h4");

    for (const header of headers) {
      let id = header.getAttribute("id")
      header.replaceWith(`<a name="${id}"></a>\n`, header, "\n")
      header.removeAttribute("id");
    }
  }

  buildOutputHtml(templateHtml) {
    const articleBody = this.domBody.outerHTML;

    const meta = this.buildArticlePageMeta();
    
    templateHtml = templateHtml.replaceAll(
      `<ARTICLE_BODY/>`, articleBody
    );
    templateHtml = templateHtml.replaceAll(
      `<ARTICLE_TITLE_TEXT/>`, meta.title
    );
    templateHtml = templateHtml.replaceAll(
      `<ARTICLE_TITLE_HTML/>`, meta.title.replaceAll("\n", "<br>")
    );
    templateHtml = templateHtml.replaceAll(
      `<AUTHOR_NAME/>`, meta.author
    );

    templateHtml = templateHtml.replaceAll(
      `<GUIDE_DATES/>`, renderGuideDates(meta, this.textualContent)
    );

    // templateHtml = templateHtml.replaceAll(
    //   `<TEXTUAL_CONTENT_DEBUG/>`, JSON.stringify(this.textualContent.sections, null, 2)
    // );

    return templateHtml;
  }

  buildArticlePageMeta() {
    return {
      header: this.header,

      title: this.header.title || "Untitled article",
      url: this.header.url || "untitled-article",
      tags: this.header.tags || [],
      author: this.header.author || null,
      datePublished: this.header.datePublished || null,
      dateUpdated: this.header.dateUpdated || null
    }
  }
}

module.exports = ArticlePage;
