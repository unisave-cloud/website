const path = require('path');

async function addGuidesUrlDependencies(asset, projectRoot) {
  const guideNames = (await asset.fs.readdir(
    path.join(projectRoot, "src", "guides")
  )).filter(n => n.endsWith(".md"));

  const dependencyIds = guideNames.map(guideName => {
    asset.invalidateOnFileChange(
      path.join(projectRoot, "src", "guides", guideName)
    );
    return asset.addURLDependency(`guides/${guideName}`);
  });

  return dependencyIds;
}

module.exports = addGuidesUrlDependencies;
