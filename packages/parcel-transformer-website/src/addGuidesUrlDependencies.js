const path = require('path');
const { glob } = require("glob");

async function addGuidesUrlDependencies(asset, projectRoot) {
  const guideNames = (await glob(
    path.join(projectRoot, "src/guides/**/*.md")
  )).map(p => path.relative(
    path.join(projectRoot, "src/guides"), p
  ));

  const dependencyIds = guideNames.map(guideName => {
    asset.invalidateOnFileChange(
      path.join(projectRoot, "src", "guides", guideName)
    );
    return asset.addURLDependency(`guides/${guideName}`);
  });

  return dependencyIds;
}

module.exports = addGuidesUrlDependencies;
