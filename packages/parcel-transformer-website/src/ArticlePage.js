const { marked } = require("marked");
const yaml = require("js-yaml");
const { parse: parseHtml } = require("node-html-parser");
const TextualContent = require("./TextualContent");
const renderGuideDates = require("./renderGuideDates");
const renderGuideContents = require("./renderGuideContents");
const renderGuideTags = require("./renderGuideTags");
const renderGuideHeadElements = require("./renderGuideHeadElements");
const path = require("path");

class ArticlePage {
  constructor(asset, contents, options) {
    this.parcelAsset = asset; // the parcel .md asset
    this.markdownBody = contents;
    this.parcelOptions = options; // parcel options object
    
    this.yamlHeader = null;
    this.parseYamlHeader();

    this.htmlBody = marked.parse(this.markdownBody);
    this.header = this.yamlHeader ? yaml.load(this.yamlHeader) : {};

    this.domBody = parseHtml(this.htmlBody);

    this.textualContent = new TextualContent(this.domBody);

    // TODO: build the lunr index from this.textualContent.sections

    this.formatHeadings();

    // TODO: format code blocks
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
      let id = header.getAttribute("id");
      header.innerHTML = `
        <a
          href="#${id}"
          onclick="navigator.clipboard.writeText(this.href);"
        >${header.innerHTML}</a>
      `
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
      `<ARTICLE_TITLE_HTML/>`, meta.titleHtml
    );
    templateHtml = templateHtml.replaceAll(
      `<AUTHOR_NAME/>`, meta.author
    );
    templateHtml = templateHtml.replaceAll(
      `<GUIDE_DATES/>`, renderGuideDates(meta, this.textualContent)
    );
    templateHtml = templateHtml.replaceAll(
      `<GUIDE_CONTENTS/>`, renderGuideContents(this.textualContent)
    );
    templateHtml = templateHtml.replaceAll(
      `<GUIDE_TAGS/>`, renderGuideTags(meta)
    );
    templateHtml = templateHtml.replaceAll(
      `<GUIDE_HEAD_ELEMENTS/>`, renderGuideHeadElements(meta)
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
      titleHtml: this.header.titleHtml || "Untitled article",
      url: this.header.url || "untitled-article",
      image: this.header.image || null,
      tags: this.header.tags || [],
      author: this.header.author || null,
      datePublished: this.header.datePublished || null,
      dateUpdated: this.header.dateUpdated || null,

      // e.g. "/src/guides/foo/foo.md"
      parcelAssetPath: "/" + path.relative(
        this.parcelOptions.projectRoot,
        this.parcelAsset.filePath
      ),
      articleDescription: this.textualContent.articleDescription
    }
  }
}

module.exports = ArticlePage;
