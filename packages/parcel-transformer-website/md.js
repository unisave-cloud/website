const { Transformer } = require("@parcel/plugin");
const { marked } = require("marked");
const path = require("path");
const yaml = require("js-yaml");

// Take a look at: (yaml header separation)
// https://github.com/j201/meta-marked/blob/master/lib/meta-marked.js

exports.default = new Transformer({
  async transform({ asset, options }) {
    
    asset.type = "html";

    const templatePath = path.join(options.projectRoot, "src/docs/_template.html");
    const templateHtml = await options.inputFS.readFile(templatePath, "utf-8");

    asset.invalidateOnFileChange(templatePath);

    const markdown = await asset.getCode();
    const markdownHtml = marked.parse(markdown);

    const html = templateHtml.replace("@docBody", markdownHtml);

    asset.setCode(html);

    return [asset];
  }
});
