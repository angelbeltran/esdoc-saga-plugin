const htmlparser = require("htmlparser2")


module.exports = class SagaPlugin {
  constructor (sagas) {
    // for tracking the sagas being documented
    this._sagas = sagas || []
  }

  push () {
    this._sagas.push.apply(this._sagas, arguments)
  }

  _isHTML (content) {
    return content.indexOf('<!DOCTYPE html>') === 0
  }

  /**
   * dom json format
   *
   * {
   *   data: String,
   *   type: String, // e.g. tag or text
   *   name: String, // e.g. div or html
   *   attribs: Object,
   *   children: [Node],
   *   next: Node,
   *   prev: Node,
   *   parent: Node,
   * }
   */

  exec (content) {
    if (!this._isHTML(content)) {
      return content
    }

    const domHandler = new htmlparser.DomHandler((error, dom) => {
      if (error) {
        console.error(error)
        return
      }

      this._sagas.forEach((saga) => {
        // <html><body><div class="content"><div data-ice="details"><div class="detail">
        const query = [
          (n) => n.name === 'html',
          (n) => n.name === 'body' && n.attribs.class === 'layout-container' && n.attribs['data-ice'] === 'rootContainer',
          (n) => n.name === 'div' && n.attribs.class === 'content' && n.attribs['data-ice'] === 'content',
          (n) => n.name === 'div' && n.attribs['data-ice'] === 'details',
          (n) => n.name === 'div' && n.attribs.class === 'detail' && n.attribs['data-ice'] === 'detail',
          (n, s) => n.name === 'div' && n.attribs['data-ice'] === 'properties' && s.length && s[1].name === 'h3' && s[1].attribs.id === `static-function-${saga.name}`,
          (n) => n.name === 'div' && n.attribs['data-ice'] === 'properties',
        ]
        // query = [(HtmlNode) => Boolean]
        function search (query, node, siblings) {
          if (query[0](node, siblings)) {
            if (query.length === 1) {
              return node
            } else {
              return (node.children || []).reduce(
                (match, child, i, siblings) => match || search(query.slice(1), child, siblings),
                null
              )
            }
          }

          return null
        }

        // find the html node to add our redux-saga info to
        let node
        for (let i = 0; i < dom.length; i++) {
          node = search(query, dom[i], dom)
          if (node) {
            break
          }
        }
        if (!node) {
          return
        }

        // generate additional html for saga effect info (if any)
        function parseSagaTags (doc) {
          return doc.unknown
            .reduce((tags, tag) => {
              if (tag.tagName.indexOf('@saga') === 0) {
                tags.push(tag)
              }
              return tags
            }, [])
            .map((tag) => {
              const name = tag.tagName.slice(5)
              const splitValue = tag.tagValue.split(' - ')
              const value = splitValue[0]
              const desc = splitValue[1]

              return `      <tr data-ice="property" data-depth="0">
            <td data-ice="type" class="code" data-depth="0">${name}</td>
            <td data-ice="value" class="code">${value}</td>
            <td data-ice="description"><p>${desc}</p></td>
          </tr>`
            }).join('\n')
        }

        const sagaEffectsTable = `<h4 data-ice="title">Saga Effects:</h4>
      <table class="params">

        <thead>
          <tr><td>Type</td><td>Value</td><td>Description</td></tr>
        </thead>

        <tbody>
    ${parseSagaTags(saga)}
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
      content = htmlparser.DomUtils.getOuterHTML(dom)
    })
    const parser = new htmlparser.Parser(domHandler)

    parser.write(content)
    parser.end()

    return content
  }
}
