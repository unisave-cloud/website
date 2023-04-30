const { Transformer } = require("@parcel/plugin");
const path = require("path");
const ArticlePage = require("./src/ArticlePage");

exports.default = new Transformer({
  async transform({ asset, options }) {
    
    asset.type = "html";

    const templatePath = path.join(options.projectRoot, "src/docs/_template.html");
    const templateHtml = await options.inputFS.readFile(templatePath, "utf-8");

    asset.invalidateOnFileChange(templatePath);

    const page = new ArticlePage(
      await asset.getCode()
    );
    const htmlBody = page.buildOutputHtml();
    const articlePage = page.buildArticlePageMeta();

    const pageHtml = templateHtml.replace("@docBody", htmlBody);
    
    asset.setCode(pageHtml);

    asset.meta.articlePage = articlePage;

    return [asset];
  }
});
