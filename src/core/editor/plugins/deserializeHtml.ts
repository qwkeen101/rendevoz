import Id from '@/utils/id'
import { Descendant, Element, Text } from 'slate'
import { jsx } from 'slate-hyperscript'
import { TableRowElement } from '~/typings'
const ELEMENT_TAGS = {
  A: el => ({ type: 'link', url: el.getAttribute('href'), id: Id.getId() }),
  BLOCKQUOTE: () => ({ type: 'quote', id: Id.getId() }),
  H1: () => ({ type: 'heading-one', id: Id.getId() }),
  H2: () => ({ type: 'heading-two', id: Id.getId() }),
  H3: () => ({ type: 'heading-three', id: Id.getId() }),
  H4: () => ({ type: 'heading-four', id: Id.getId() }),
  H5: () => ({ type: 'heading-five', id: Id.getId() }),
  H6: () => ({ type: 'heading-six', id: Id.getId() }),
  IMG: el => ({ type: 'image', url: el.getAttribute('src'), id: Id.getId() }),
  LI: () => ({ type: 'list-item', id: Id.getId() }),
  OI: () => ({ type: 'order-list-item', id: Id.getId() }),
  OL: () => ({ type: 'numbered-list', id: Id.getId() }),
  P: () => ({ type: 'paragraph', id: Id.getId() }),
  PRE: () => ({ type: 'pre', id: Id.getId() }),
  TABLE: () => ({ type: 'table', id: Id.getId(), columns: [] }),
  TD: () => ({ type: 'tableCell', id: Id.getId() }),
  TR: () => ({ type: 'tableRow' }),
  TH: () => ({ type: 'tableCell', id: Id.getId() }),
  SUP: () => ({ type: 'sup', id: Id.getId() }),
  FIGCAPTION: () => ({ type: 'figcaption', id: Id.getId() })
}

// COMPAT: `B` is omitted here because Google Docs uses `<b>` in weird ways.
const TEXT_TAGS = {
  CODE: () => ({ code: true }),
  DEL: () => ({ strikethrough: true }),
  EM: () => ({ italic: true }),
  I: () => ({ italic: true }),
  S: () => ({ strikethrough: true }),
  STRONG: () => ({ bold: true }),
  U: () => ({ underline: true })
}

const normalizeEmptyChildren = (descendant: Descendant[]) => {
  if (!descendant.length) {
    return [{ text: '' }]
  }
  return descendant
}
export const normalize = (descendants: Descendant[]) => {
  descendants = normalizeEmptyChildren(descendants)
  descendants = descendants.map(n => {
    if (Element.isElement(n)) {
      return {
        ...n,
        children: normalize(n.children)
      }
    }
    return n
  })
  return descendants
}
export const deserializeHtmlNode = (node: HTMLElement | ChildNode) => {
  if (node.nodeType === Node.TEXT_NODE) {
    // const trimmedText = node.textContent?.replace(/^\n+|\n+$/g, '') ?? ''
    // return trimmedText.length > 0 ? trimmedText : null
    return node.textContent || ''
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null
  // for span in header TODO: more format
  if (node.nodeName === 'SPAN') {
    if (node.textContent) {
      return jsx('text', {}, node.textContent)
    }
    return null
  }
  if (node.nodeName === 'BR') return '\n'
  if (node.nodeName === 'BODY') {
    return jsx('fragment', {}, deserializeHtmlNodeChildren(node))
  }
  const { nodeName } = node
  //deserizlize element
  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](node)
    let children = deserializeHtmlNodeChildren(node)
    if (nodeName === 'TABLE') {
      let maxColumnLength = 0
      children = children.filter(i => i.type && i.type === 'tableRow') as TableRowElement[]
      children.forEach(i => (maxColumnLength = Math.max(maxColumnLength, i.children.length)))
      attrs.columns = []
      for (let i = 0; i < maxColumnLength; i++) {
        attrs.columns.push({
          accessor: `col${i}`
        })
      }
      ;(children as TableRowElement[]).forEach(row => {
        row.children.forEach((cell, cellIdx) => {
          cell.colName = attrs.columns[cellIdx]?.accessor
        })
      })
    }
    if (nodeName === 'TD') {
      // wrap in a paragraph
      return jsx('element', attrs, jsx('element', { id: Id.getId(), type: 'paragraph' }, !children.length ? [{ text: '' }] : children))
    }
    return jsx('element', attrs, !children.length ? [{ text: '' }] : children)
  }
  const text = TEXT_TAGS[nodeName]?.(node)
  //deserialize leaf
  return deserializeHtmlNodeChildren(node).reduce((arr, child) => {
    if (!child) return arr
    if (Element.isElement(child)) {
      arr.push(child)
    } else {
      if (text) {
        arr.push(jsx('text', text, child))
      } else {
        arr.push(jsx('text', {}, child || ''))
      }
    }
    return arr
  }, [])
}

const deserializeHtmlNodeChildren = (node: HTMLElement | ChildNode): any[] => {
  return Array.from(node.childNodes)
    .map(n => deserializeHtmlNode(n))
    .flat()
    .filter(i => i !== null)
}
