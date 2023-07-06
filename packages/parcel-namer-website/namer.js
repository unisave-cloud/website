const { Namer }  = require("@parcel/plugin");
const path = require("path");

const DEBUG = false

/**
 * Names article pages (guides and docs, that are .md files)
 */
function nameArticlePage({ bundle, asset, logger, options }) {
  // make it an index.html inside its folder,
  // do not include content hash
  const bundlePath = asset.meta.articlePage.url + "/index.html";

  if (DEBUG) {
    logger.info({
      message: `Bundle (${bundle.type}): ` + asset.filePath
    });
    logger.info({
      message: `    -> Named: ` + bundlePath
    });
  }

  return bundlePath;
}

/**
 * Names standalone .html files (those that do not come from a .md file)
 */
function nameHtmlPages({ bundle, asset, logger, options }) {
  // make it an index.html inside its folder,
  // do not include content hash
  let bundlePath = path.relative(
    path.join(options.projectRoot, "src"),
    asset.filePath
  );

  if (!bundlePath.endsWith("index.html")) { // if it's not an index already
    bundlePath = bundlePath.replace(/\.html$/, ""); // remove extension
    bundlePath += "/index.html"; // make it index in a folder
  }

  if (DEBUG) {
    logger.info({
      message: `Bundle (${bundle.type}): ` + asset.filePath
    });
    logger.info({
      message: `    -> Named: ` + bundlePath
    });
  }

  return bundlePath;
}

/**
 * Names static assets, like CSS, JS, and images
 */
function nameStaticAsset({ bundle, asset, logger, options }) {
  // use the path in the src directory, update extension and add content hash
  
  let bundlePath = path.relative(
    path.join(options.projectRoot, "src"),
    asset.filePath
  );
  bundlePath = bundlePath.replace(/\.[a-zA-Z]+$/, ""); // remove extension

  // add hash and correct extension
  if (!bundle.needsStableName) {
    bundlePath += "." + bundle.hashReference;
  }
  bundlePath = bundlePath + "." + bundle.type;

  if (DEBUG) {
    logger.info({
      message: `Bundle (${bundle.type}): ` + asset.filePath
    });
    logger.info({
      message: `    -> Named: ` + bundlePath
    });
  }

  return bundlePath;
}

module.exports.default = new Namer({
  async name({ bundle, bundleGraph, logger, options }) {

    // skip bundles that will be inlined (included in other bundles)
    if (bundle.bundleBehavior === "inline") {
      return null;
    }

    // get the bundle entrypoint asset and skip bundles that don't have it
    const asset = bundle.getMainEntry();
    if (!asset || !asset.filePath)
      return null;
    
    // name article pages (guides and docs)
    if (bundle.type === "html" && asset.meta.articlePage) {
      return nameArticlePage({ bundle, asset, logger, options });
    }

    // name .html pages
    if (bundle.type === "html") {
      return nameHtmlPages({ bundle, asset, logger, options });
    }

    if (bundle.type === "css"
      || bundle.type === "js"
      || bundle.type === "svg"
      || bundle.type === "jpg"
      || bundle.type === "png"
    ) {
      return nameStaticAsset({ bundle, asset, logger, options });
    }

    return null;
  }
});