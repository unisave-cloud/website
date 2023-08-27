const { parse: parseHtml, HTMLElement } = require("node-html-parser");
const Prism = require('prismjs');
const loadLanguages = require('prismjs/components/');

loadLanguages([
  "csharp", "json", "yaml", "html", "xml", "php", "bash"
]);

/**
 * Styles code blocks using the highlight.js library
 * @param {HTMLElement} domBody DOM of the markdown webpage
 */
function formatCodeBlocks(domBody) {
  const pres = domBody.querySelectorAll("pre");

  pres.forEach(pre => formatSingleCodeBlockPre(pre));
}

/**
 * @param {HTMLElement} pre
 */
function formatSingleCodeBlockPre(pre) {
  // contents of <pre> tags are not parsed by the "node-html-parser",
  // so we need to parse them once more to extract out
  // the outermost <code> tag with the language
  const preDom = parseHtml(`<div>` + pre.innerHTML + `</div>`);

  // extract info
  const codeElement = preDom.querySelector("code");
  const codeBlockContent = codeElement.text; // like innerText
  const language = codeElement.classNames?.substr("language-".length);

  // if the language is not specified, we do no formatting
  if (!language)
    return;
  
  // format the given code block
  const styledContent = Prism.highlight(
    codeBlockContent,
    Prism.languages[language],
    language
  );

  // modify the article DOM
  codeElement.innerHTML = styledContent;
  pre.innerHTML = codeElement.outerHTML;
}

module.exports = formatCodeBlocks;