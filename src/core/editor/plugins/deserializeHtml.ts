import Id from '@/utils/id'
import { Descendant, Element } from 'slate'
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
  IMG: el => ({
    type: 'image',
    url: el.getAttribute('data-src') || el.getAttribute('src'),
    id: Id.getId()
  }),
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

// Note: How to normalize HTML to Slate Nodes?
// Slate Node Types: 1. Fragment = Element[] 2. Element 3. Text
// HTML Nodes: Contain Children Element or Plain Text Node
// Plain Text Node Example: Span, Heading, A

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

const WrapperNodeNames = ['SECTION', 'DIV']

const NoNestedNodeNames = ['A', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'OI', 'PRE', 'SUP', 'FIGCAPTION']

const ElementsAvailableInParagraph = ['IMG', 'SUP', 'A']
export const deserializeHtmlNode = (node: HTMLElement | ChildNode) => {
  if (node.nodeType === Node.TEXT_NODE) {
    // const trimmedText = node.textContent?.replace(/^\n+|\n+$/g, '') ?? ''
    // return trimmedText.length > 0 ? trimmedText : null
    if (!node.previousSibling && !node.nextSibling) return node.textContent?.trim() || ''
    if (!node.nextSibling) return node.textContent?.trimEnd() || ''
    if (!node.previousSibling) return node.textContent?.trimStart() || ''

    return node.textContent || ''
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null
  // for span in header TODO: more format
  if (node.nodeName === 'SPAN') {
    if (Array.from(node.childNodes).every(i => i.nodeType === Node.TEXT_NODE)) {
      if (node.textContent) {
        const parentNodeName = node.parentNode?.nodeName
        // span in div / section, not in paragraph, turn into paragraph
        if (parentNodeName && WrapperNodeNames.includes(parentNodeName)) {
          return jsx('element', { type: 'paragraph', id: Id.getId() }, [{ text: node.textContent }])
        }
        return jsx('text', {}, node.textContent)
      }
      return null
    }
  }
  if (node.nodeName === 'BR') return '\n'
  if (node.nodeName === 'BODY') {
    return jsx('fragment', {}, deserializeHtmlNodeChildren(node))
  }
  const { nodeName } = node
  //deserizlize element

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](node)
    let children: any[] = []
    if (NoNestedNodeNames.includes(nodeName)) {
      const textContent = getNestedTextContent(node)
      children = [{ text: textContent }]
    } else {
      children = deserializeHtmlNodeChildren(node)
    }
    // img in p, ...in p
    if (nodeName === 'P') {
      if (Array.from(node.childNodes).some(i => ELEMENT_TAGS[i.nodeName] && !ElementsAvailableInParagraph.includes(i.nodeName))) {
        console.log(
          'meet nested in paragraph',
          Array.from(node.childNodes).filter(i => ELEMENT_TAGS[i.nodeName] && !ElementsAvailableInParagraph.includes(i.nodeName))
        )
        // turn <p>...</p> into <span/>, <img/>, <span/> <span/>
        // then wrap them together

        return jsx('fragment', {}, deserializeHtmlNodeChildren(node))
      }
    }
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

const getNestedTextContent = (node: HTMLElement | ChildNode) => {
  const text: string[] = []
  node.childNodes.forEach(function check(child) {
    if (child.nodeType === Node.TEXT_NODE) {
      text.push(child.nodeValue?.trim())
    }
    child.childNodes.forEach(check)
  })
  return text.join(' ')
}
const deserializeHtmlNodeChildren = (node: HTMLElement | ChildNode): any[] => {
  const res = Array.from(node.childNodes)
    .map(n => deserializeHtmlNode(n))
    .flat()
    .filter(i => i !== null)
  return res
}
