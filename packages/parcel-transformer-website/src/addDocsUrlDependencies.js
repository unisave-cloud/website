const path = require('path');
const { glob } = require("glob");

async function addDocsUrlDependencies(asset, projectRoot) {
  let docNames = (await glob(
    path.join(projectRoot, "src/docs/**/*.md")
  )).map(p => path.relative(
    path.join(projectRoot, "src/docs"), p
  ));

  // remove files starting with underscore (like _navigation.md)
  docNames = docNames.filter(n => !path.basename(n).startsWith("_"));

  const dependencyIds = docNames.map(docName => {
    asset.invalidateOnFileChange(
      path.join(projectRoot, "src", "docs", docName)
    );
    return asset.addURLDependency(`docs/${docName}`);
  });

  return dependencyIds;
}

module.exports = addDocsUrlDependencies;
