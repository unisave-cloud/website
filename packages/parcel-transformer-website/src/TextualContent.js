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

    this.sections = [];
    this.parseSections();

    // number of words
    this.wordCount = this.countWords();

    // description used for meta tags
    this.articleDescription = this.extractDescription();
  }

  parseSections() {
    this.sections = [];

    const headingTags = {
      "h2": true, "h3": true, "h4": true
    };
    const contentTags = {
      "p": true, "blockquote": true, "ul": true, "ol": true
    };

    // pre-section that has no heading, but has content
    let section = {
      id: null,
      title: null,
      tag: null,
      content: []
    };
    for (let child of this.domBody.childNodes) {
      if (child.nodeType !== NodeType.ELEMENT_NODE)
        continue;

      if (child.tagName.toLowerCase() in headingTags) {
        if (section !== null) {
          this.sections.push(section);
        }
        section = {
          id: child.getAttribute("id"),
          title: child.innerText,
          tag: child.tagName.toLowerCase(),
          content: []
        }
      }

      if (child.tagName.toLowerCase() in contentTags && section !== null) {
        section.content.push(child.innerText);
      }
    }
    if (section !== null) {
      this.sections.push(section);
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

  extractDescription() {
    const MAX_LENGTH = 130;
    
    for (let section of this.sections) {
      for (let text of section.content) {
        return text.substring(0, MAX_LENGTH) + "...";
      }
    }

    return null;
  }
}

module.exports = TextualContent;