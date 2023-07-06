/**
 * Called on URLs of the output files to remove those /index.html suffixes
 * and add domain prefixes.
 * @param {string} url
 */
function processUrl(url) {
  const originalUrl = url

  // ignore external URLs (they start with "http")
  if (url.startsWith("http")) {
    return url;
  }

  // ignore inside-page URLs (they start with #)
  if (url.startsWith("#")) {
    return url;
  }

  // remove the trailing "/index.html",
  // unless its the root index reference, in which case make this just a slash
  if (url === "/index.html" || url === "index.html") {
    url = "/";
  } else {
    url = url.replace(/\/index\.html$/, "");
  }

  // add leading server name to absolute URLs (URLs starting with slash)
  // TODO...

  // DEBUG
  // console.log(originalUrl + " -> " + url);
  
  return url;
}

module.exports = processUrl;