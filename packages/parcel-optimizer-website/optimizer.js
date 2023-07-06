const { Optimizer }  = require("@parcel/plugin");
const path = require("path");
const posthtml = require("posthtml");
const shorten = require("posthtml-shorten");
const processUrl = require("./processUrl");

function processHtml(contents) {
  return new Promise((resolve, reject) => {
    
    // see: https://github.com/Rebelmail/posthtml-shorten
    // and: https://parceljs.org/languages/html/#posthtml.config.js
    
    var shortener = {
      process: function (url) {
        return new Promise((resolve, reject) => {
          resolve(processUrl(url));
        });
      },
    };
    
    var options = {
      shortener: shortener,
      tag: ['a', 'link'],
      attribute: ['href'],
    };

    posthtml()
      .use(shorten(options))
      .process(contents)
      .then(function(result) {
        resolve(result.html);
      });
  });
}

module.exports.default = new Optimizer({
  async optimize({ bundle, contents, map, logger }) {

    // logger.info({
    //   message: "Optimizing: " + contents
    // })

    contents = await processHtml(contents);
    // source map should be also modified, but... lots of work, little gain

    return {
      contents: contents,
      sourceMap: map
    };
  }
});
