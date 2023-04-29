const { Transformer } = require("@parcel/plugin");
const path = require('path');

module.exports.default = new Transformer({
  async transform({ asset, options }) {
    const dependencyIds = []


    // === Guides ===

    const guideNames = await asset.fs.readdir(
      path.join(path.dirname(asset.filePath), "guides")
    );

    guideNames.map(guideName => {
      const id = asset.addURLDependency(
        path.join("guides", guideName)
      );
      dependencyIds.push(id);
    });


    // === Docs ===

    const docNames = await asset.fs.readdir(
      path.join(path.dirname(asset.filePath), "docs")
    );

    docNames.map(docName => {
      const id = asset.addURLDependency(
        path.join("docs", docName)
      );
      dependencyIds.push(id);
    });


    // === Other files ===

    dependencyIds.push(
      asset.addURLDependency("index.html")
    );
    dependencyIds.push(
      asset.addURLDependency("docs/index.html")
    );
    dependencyIds.push(
      asset.addURLDependency("guides/index.html")
    );


    // === Build asset content ===
    
    asset.setCode(
      dependencyIds.join("\n")
    );

    return [asset];
  }
});
