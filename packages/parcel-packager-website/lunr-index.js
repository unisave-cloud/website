const { Packager } = require("@parcel/plugin");
const path = require('path');

module.exports.default = new Packager({
  async package({ bundle, bundleGraph, logger }) {

    let articlePages = [];
    bundle.traverse(node => {
      if (node.type !== "dependency")
        return;

      let asset = bundleGraph.getResolvedAsset(node.value, bundle);

      if (!asset.meta.articlePage)
        return;

      articlePages.push(asset.meta.articlePage);
    });

    const contents = JSON.stringify(articlePages, null, 2);
    return { contents };
  }
});
