const { Transformer } = require("@parcel/plugin");
const { marked } = require("marked");

exports.default = new Transformer({
  async transform({ asset }) {
    
    asset.type = "html";

    const markdown = await asset.getCode();
    const html = marked.parse(markdown);

    asset.setCode(html);

    return [asset];
  }
});
