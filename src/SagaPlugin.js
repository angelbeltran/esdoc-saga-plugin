const htmlparser = require("htmlparser2")


/**
 * The plugin aggregates sagas found during parsing using
 * it's push method, and inserts content into the html
 * based on the sagas using the exec method
 */
module.exports = class SagaPlugin {
  /**
   * Initialized the list of sagas, optionally accepting a list
   * of sagas to initialize with
   * @param {function[]} sagas - array of sagas, generator functions
   * saga* tags
   */
  constructor (sagas) {
    // for tracking the sagas being documented
    /**
     * @type {function[]} sagas with documentation to create
     */
    this._sagas = [].concat(sagas || [])
  }

  /**
   * Simply pushes its arguments to the saga list
   * @public
   */
  push () {
    for (let i = 0; i < arguments.length; this._sagas.push(arguments[i++])) {}
  }

  /**
   * Checks if a string is html
   * @param {string} content
   * @private
   */
  isHTML (content) {
    return content.indexOf('<!DOCTYPE html>') === 0
  }

  /**
   * Generates a saga effect table row
   * @param {object} tag - a ESDoc tag object
   * @return {string} an html <tr>
   * @private
   */
  generateTableEntry (tag) {
    const name = tag.tagName.slice(5)
    const splitValue = tag.tagValue.split(' - ')
    const value = splitValue[0]
    const desc = splitValue[1]

    return `      <tr data-ice="property" data-depth="0">
      <td data-ice="type" class="code" data-depth="0">${name}</td>
      <td data-ice="value" class="code">${value}</td>
      <td data-ice="description"><p>${desc}</p></td>
    </tr>`
  }

  /**
   * Generates an html table for saga effect info, if any, on a doc
   * @param {object} doc - an ESDoc doc object
   * @return {string} rows, html <tr>, for a saga effect table
   * @private
   */
  parseSagaTags (doc) {
    return (doc.unknown || [])
      .filter((tag) => tag.tagName.indexOf('@saga') === 0)
      .map(this.generateTableEntry)
      .join('\n')
  }

  /*
   */

  /**
   * Travels a dom tree, and inserts a saga effects tables if the
   * appropriate location is found.
   * Expects dom to be in the json format: {
   *   data: String,
   *   type: String, // e.g. tag or text
   *   name: String, // e.g. div or html
   *   attribs: Object,
   *   children: [Node],
   *   next: Node,
   *   prev: Node,
   *   parent: Node
   * }
   * @param {Object} contentWrapper
   * @property {string} content - an html string
   * @private
   */
  getDomInjector (contentWrapper) {
    return (error, dom) => {
      if (error) {
        console.error(error)
        return
      }

      this._sagas.forEach((saga) => {
        /* Attach the table to the bottom of the tree:
         *  <html>
         *    <body class="layout-container" data-ice="rootContainer">
         *      <div class="content" data-ice="content">
         *        <div data-ice="details">
         *          <div class="detail" data-ice="detail">
         *            <h3 data-ice="anchor" id="static-function-${saga.name}>
         *            < ... >
         *            < insert node here >
         */
        /**
         * @type {Array<function(n: object, s: object)>} list of dom queries
         */
        const query = [
          (n) => n.name === 'html',
          (n) => n.name === 'body' && n.attribs.class === 'layout-container' && n.attribs['data-ice'] === 'rootContainer',
          (n) => n.name === 'div' && n.attribs.class === 'content' && n.attribs['data-ice'] === 'content',
          (n) => n.name === 'div' && n.attribs['data-ice'] === 'details',
          (n) => n.name === 'div' && n.attribs.class === 'detail' && n.attribs['data-ice'] === 'detail',
          (n) => n.name === 'h3' && n.attribs['data-ice'] === 'anchor' && n.attribs.id === `static-function-${saga.name}`,
        ]
        // query = [(HtmlNode) => Boolean]
        /**
         * Finds a dom node matching a query
         * @param {Array<function(n: object, s: object)>} query to perform upon dom node and descendants
         * @param {object} node - dom node to query
         */
        function search (query, node) {
          if (query[0](node)) {
            if (query.length === 1) {
              return node
            } else {
              return (node.children || []).reduce(
                (match, child, i) => match || search(query.slice(1), child),
                null
              )
            }
          }

          return null
        }

        /**
         * The matching html node, if found
         * @type {object}
         */
        let anchorNode
        for (let i = 0; i < dom.length; i++) {
          anchorNode = search(query, dom[i], dom)
          if (anchorNode) {
            break
          }
        }
        if (!anchorNode) {
          return
        }
        const node = anchorNode.parent

        const sagaEffectsTable = `<h4 data-ice="title">Saga Effects:</h4>
      <table class="params">

        <thead>
          <tr><td>Type</td><td>Value</td><td>Description</td></tr>
        </thead>

        <tbody>
    ${this.parseSagaTags(saga)}
        </tbody>

      </table>`

        // insert the new html
        const innerDomHandler = new htmlparser.DomHandler(function (error, dom) {
          if (error) {
            throw error
          } else {
            node.children = node.children.concat(dom)
            for (let i = 0; i < node.children.length - 1; i++) {
              node.children[i].next = node.children[i + 1]
              node.children[i + 1].prev = node.children[i]
              node.children[i].parent = node.children[i + 1].parent = node
            }
          }
        })
        const innerParser = new htmlparser.Parser(innerDomHandler)

        innerParser.write(sagaEffectsTable)
        innerParser.end()
      })

      // reserialize the dom, and replace the content provided in the event
      contentWrapper.content = htmlparser.DomUtils.getOuterHTML(dom)
    }
  }


  /**
   * Plugin execution function.
   * If given html, will insert tables documenting the aggregated
   * sagas below the parameter tables
   * @param {string} content - content that is potentially html
   * @public
   */
  exec (content) {
    if (!this.isHTML(content)) {
      return content
    }

    /**
     * avoid mutating the original content
     * @type {string}
     */
    const contentWrapper = { content }
    const domHandler = new htmlparser.DomHandler(this.getDomInjector(contentWrapper))
    const parser = new htmlparser.Parser(domHandler)

    parser.write(content)
    parser.end()

    return contentWrapper.content
  }
}
