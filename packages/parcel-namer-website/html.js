const { Namer }  = require("@parcel/plugin");
const path = require("path");

module.exports.default = new Namer({
  name({ bundle, bundleGraph, logger, options }) {
    if (bundle.type !== "html")
      return null;

    const asset = bundle.getMainEntry();

    if (!asset || !asset.filePath)
      return null;
    
    // get the asset path in the "src" directory
    let bundleInputPath = path.relative(
      path.join(options.projectRoot, "src"),
      asset.filePath
    );

    // replace .md with .html
    bundleInputPath = bundleInputPath.replace(/\.md$/, ".html");

    // TEST
    if (!bundleInputPath.endsWith("index.html"))
      bundleInputPath = bundleInputPath.replace(/\.html$/, "\/index.html");
    // bundleInputPath = bundleInputPath + "/index.html";

    logger.info({
      message: bundleInputPath
    });
    
    return bundleInputPath;
  }
});