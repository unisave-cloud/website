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
    let bundlePath = path.relative(
      path.join(options.projectRoot, "src"),
      asset.filePath
    );

    // replace .md with .html
    bundlePath = bundlePath.replace(/\.md$/, ".html");

    // make .html files be indexes in their respective folders
    // (ignore files that are an index already)
    if (!bundlePath.endsWith("index.html")) {
      bundlePath = bundlePath.replace(/\.html$/, "\/index.html");
    }

    // use explicit urls for article pages
    if (asset.meta.articlePage) {
      bundlePath = asset.meta.articlePage.url + "/index.html";
    }

    // logger.info({
    //   message: bundlePath
    // });
    
    return bundlePath;
  }
});