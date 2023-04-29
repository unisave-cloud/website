const { Packager } = require("@parcel/plugin");
const { replaceURLReferences } = require("@parcel/utils");
const path = require('path');

module.exports.default = new Packager({
  async package({ bundle, bundleGraph, logger }) {


    // bundle.traverse(node => {
    //   if (node.type === 'dependency' && node.value.specifierType === 'url') {
    //     // urlDependencies.push(node.value);
    //     logger.info({
    //       message: JSON.stringify(node.value.specifier)
    //     })
    //   }
    // });





    // join content
    // (there is only one asset though)
    let promises = [];
    bundle.traverseAssets(asset => {
      promises.push(asset.getCode());
    });

    let contents = await Promise.all(promises);
    contents = contents.join('\n');

    // replace dependency IDs with URLs
    ({ contents } = replaceURLReferences({ bundle, bundleGraph, contents }));

    return { contents };
  }
});
