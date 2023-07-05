const { HTMLElement, NodeType } = require("node-html-parser");

/**
 * Represents the textual content of an article and lets you peform
 * various queries over it (search index, ToC, complexity)
 */
class TextualContent {
  /**
   * @param {HTMLElement} domBody 
   */
  constructor(domBody) {
    this.domBody = domBody;

    // [{ title: "foobar", body: "lorem ipsum" }, ...]
    this.sections = [];
    this.parseSections();

    // number of words
    this.wordCount = this.countWords();
  }

  parseSections() {
    this.sections = [];

    const headingTags = {
      "h2": true, "h3": true, "h4": true
    };
    const contentTags = {
      "p": true, "blockquote": true, "ul": true, "ol": true
    };

    let section = null;
    for (let child of this.domBody.childNodes) {
      if (child.nodeType !== NodeType.ELEMENT_NODE)
        continue;

      if (child.tagName.toLowerCase() in headingTags) {
        if (section !== null) {
          section.content = section.content.join("\n");
          this.sections.push(section);
        }
        section = {
          id: child.getAttribute("id"),
          title: child.innerText,
          content: []
        }
      }

      if (child.tagName.toLowerCase() in contentTags && section !== null) {
        section.content.push(child.innerText);
      }
    }
  }

  countWords() {
    let words = 0;

    const text = this.domBody.innerText;
    let inWord = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c.toLowerCase() != c.toUpperCase()) {
        // is letter
        if (!inWord) {
          inWord = true;
          words += 1;
        }
      } else {
        // is not a letter
        inWord = false;
      }
    }

    return words;
  }
}

module.exports = TextualContent;