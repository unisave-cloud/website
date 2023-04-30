const { Transformer } = require("@parcel/plugin");
const path = require('path');
const addDocsUrlDependencies = require("./src/addDocsUrlDependencies");
const addGuidesUrlDependencies = require("./src/addGuidesUrlDependencies");

module.exports.default = new Transformer({
  async transform({ asset, options }) {
    
    await addDocsUrlDependencies(asset, options.projectRoot);
    await addGuidesUrlDependencies(asset, options.projectRoot);

    return [asset];
  }
});
