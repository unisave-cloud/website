const { Transformer } = require("@parcel/plugin");
const path = require("path");
const ArticlePage = require("./src/ArticlePage");

exports.default = new Transformer({
  async transform({ asset, options }) {
    
    asset.type = "html";

    // resolve template path
    let templatePath = null;
    const relativeFilePath = path.relative(options.projectRoot, asset.filePath);
    if (relativeFilePath.startsWith("src/docs")) {
      templatePath = path.join(options.projectRoot, "src/docs/_template/docs-template.html");
    }
    if (relativeFilePath.startsWith("src/guides")) {
      templatePath = path.join(options.projectRoot, "src/guides/_template/guides-template.html");
    }
    if (templatePath === null) {
      throw new Error(`Unknown template for file ${relativeFilePath}`);
    }

    // load template
    const templateHtml = await options.inputFS.readFile(templatePath, "utf-8");
    asset.invalidateOnFileChange(templatePath);

    // parse markdown page
    const page = new ArticlePage(
      await asset.getCode()
    );
    const pageHtml = page.buildOutputHtml(templateHtml);
    const articlePage = page.buildArticlePageMeta();
    
    // update the parcel asset
    asset.setCode(pageHtml);
    asset.meta.articlePage = articlePage;

    return [asset];
  }
});
