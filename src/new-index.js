const htmlparser = require("htmlparser2");


// for tracking the sagas being documented
const sagas = []

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

function parseContent (content) {
  if (content.indexOf('<!DOCTYPE html>') === -1) {
    return content
  }

  const domHandler = new htmlparser.DomHandler(function (error, dom) {
    if (error) {
      console.error(error)
      return
    }

    // TODO: based on the function doc, find the appropriate part of the dom to insert html
    // <html><body><div class="content"><div data-ice="details"><div class="detail">
    const query = [
      (n) => n.name === 'html',
      (n) => n.name === 'body' && n.attribs.class === 'layout-container' && n.attribs['data-ice'] === 'rootContainer',
      (n) => n.name === 'div' && n.attribs.class === 'content' && n.attribs['data-ice'] === 'content',
      (n) => n.name === 'div' && n.attribs['data-ice'] === 'details',
      (n) => n.name === 'div' && n.attribs.class === 'detail' && n.attribs['data-ice'] === 'detail',
      (n) => n.name === 'div' && n.attribs['data-ice'] === 'properties',
      (n) => n.name === 'div' && n.attribs['data-ice'] === 'properties',
    ]
    // query = [(HtmlNode) => Boolean]
    function search (query, node) {
      if (query[0](node)) {
        if (query.length === 1) {
          return node
        } else {
          return (node.children || []).reduce(
            (match, child) => match || search(query.slice(1), child),
            null
          )
        }
      }

      return null
    }

    // find the html node to add our redux-saga info to
    let node
    for (let i = 0; i < dom.length; i++) {
      node = search(query, dom[i])
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
${parseSagaTags(sagas[0])}
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

    // reserialize the dom, and replace the content provided in the event
    content = htmlparser.DomUtils.getOuterHTML(dom)
  })
  const parser = new htmlparser.Parser(domHandler)

  parser.write(content)
  parser.end()

  return content
}


module.exports.onHandleContent = function(ev) {
  //console.log('onHandleContent')
  //console.log('content:', ev.data.content)
  // modify content
  // ev.data.content = ...;
  // <html><body><div class="content"><div data-ice="details"><div class="detail">
  //   - add a <div> -- Content -- </div> here
  ev.data.content = parseContent(ev.data.content)
};

module.exports.onHandleDocs = function(ev) {
  //console.log('onHandleDocs')
  // modify content
  // ev.data.docs = ...;
  ev.data.docs.filter(d => d.kind === 'function').forEach((d) => {
    if (d.unknown) {
      for (let i = 0; i < d.unknown.length; i++) {
        const unknownTag = d.unknown[i].tagName
        if (unknownTag.indexOf('@saga') === 0) {
          sagas.push(d)
          break
        }
      }
    }
  })
};

/*
function stripNode (node) {
  if (node.hasOwnProperty('next')) {
    delete node.next
  }
  if (node.hasOwnProperty('prev')) {
    delete node.prev
  }
  if (node.hasOwnProperty('parent')) {
    delete node.parent
  }
  if (Array.isArray(node.children)) {
    node.children.forEach(stripNode)
  }
  return node
}
*/
