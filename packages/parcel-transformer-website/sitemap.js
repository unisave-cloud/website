const { Transformer } = require("@parcel/plugin");
const path = require('path');
const addDocsUrlDependencies = require("./src/addDocsUrlDependencies");
const addGuidesUrlDependencies = require("./src/addGuidesUrlDependencies");

module.exports.default = new Transformer({
  async transform({ asset, options }) {
    const dependencyIds = [
      ...await addDocsUrlDependencies(asset, options.projectRoot),
      ...await addGuidesUrlDependencies(asset, options.projectRoot),
      asset.addURLDependency("index.html"),
      asset.addURLDependency("docs/index.html"),
      asset.addURLDependency("guides/index.html")
    ];

    asset.setCode(
      dependencyIds.join("\n")
    );

    return [asset];
  }
});
