/**
 * Called on URLs of the output files to remove those /index.html suffixes
 * and add domain prefixes.
 * @param {string} url
 */
function processUrl(url) {
  // remove the trailing "/index.html",
  // unless its the root index reference, in which case make this just a slash
  if (url === "/index.html" || url === "index.html") {
    url = "/";
  } else {
    url = url.replace(/\/index\.html$/, "");
  }
  
  return url;
}

module.exports = processUrl;