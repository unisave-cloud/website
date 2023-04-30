const path = require('path');

async function addDocsUrlDependencies(asset, projectRoot) {
  const docNames = (await asset.fs.readdir(
    path.join(projectRoot, "src", "docs")
  )).filter(n => n.endsWith(".md"));

  const dependencyIds = docNames.map(docName => {
    asset.invalidateOnFileChange(
      path.join(projectRoot, "src", "docs", docName)
    );
    return asset.addURLDependency(`docs/${docName}`);
  });

  return dependencyIds;
}

module.exports = addDocsUrlDependencies;
