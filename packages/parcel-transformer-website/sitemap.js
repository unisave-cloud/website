const { Transformer } = require("@parcel/plugin");

module.exports.default = new Transformer({
  async transform({ asset, options }) {
    
    asset.setCode("New content: " + asset.filePath + "\n" + options.projectRoot);

    return [asset];
  }
});
