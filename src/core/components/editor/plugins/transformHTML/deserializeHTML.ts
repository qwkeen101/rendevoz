import deserializeTextNode from './deserialize/deserializeTextNode'
import deserializeSpan from './deserialize/deserializeSpan'
import { jsx } from 'slate-hyperscript'
import deserializeMedia from './deserialize/deserializeMedia'
import { WrapperNodeNames } from './consts'
import deserializeParagraph from './deserialize/deserializeParagraph'
import deserializeText from './deserialize/deserializeText'
import { ELEMENT_TAGS } from '@/core/components/editor/plugins/transformHTML/HTMLTags'
import normalizeText from '@/core/components/editor/plugins/transformHTML/deserialize/normalizeText'
import deserializeLi from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeLi'
import { Descendant, Node as SlateNode, Text } from 'slate'
import { EditorTypeToElementMap } from '@/core/components/editor/maps'
import Id from '@/utils/id'
import deserializeTable from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeTable'
import deserializeLink from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeLink'
import deserializeWeixinAudio from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeWeixinAudio'

const NoNestedNodeNames = ['A', 'H1', 'H2', 'H3', 'LI', 'H4', 'H5', 'H6', 'PRE', 'SUP', 'FIGCAPTION', 'BLOCKQUOTE']

const deserializeHTML = (root: HTMLElement): Descendant[] | null => {
  // deserialize text node
  if (root.nodeType === Node.TEXT_NODE) {
    return deserializeText(root)
  }
  // if not text node or element node, return null
  if (root.nodeType !== Node.ELEMENT_NODE) return null
  if (WrapperNodeNames.includes(root.nodeName)) {
    const c = deserializeHTMLChildren(root).filter(i => !Text.isText(i))
    return jsx('fragment', {}, c)
  }
  switch (root.nodeName) {
    case 'ARTICLE':
    case 'SECTION':
    case 'DIV':
    case 'P':
      return deserializeParagraph(root)
    case 'LI':
      return deserializeLi(root)
    case 'BLOCKQUOTE':
      return deserializeParagraph(root, 'block-quote')
    case 'SPAN':
      return deserializeSpan(root)
    // TODO
    case 'MP-COMMON-MPAUDIO':
      return deserializeWeixinAudio(root)
    case 'BR':
      return null
    case 'TBODY':
    case 'TR':
    case 'TD':
    case 'TABLE':
      return deserializeTable(root)
    case 'IMG':
    case 'AUDIO':
    case 'IFRAME':
      return deserializeMedia(root)
    default: {
      if (ELEMENT_TAGS[root.nodeName]) {
        if (root.nodeName === 'A') {
          const result = deserializeLink(root)
          if (result) {
            return result
          }
        }
        const attrs = ELEMENT_TAGS[root.nodeName](root)
        let children: any[] = []
        if (NoNestedNodeNames.includes(root.nodeName)) {
          const textContent = normalizeText(root)
          if (textContent?.length) {
            children = [{ text: textContent }]
          }
        } else {
          children = deserializeHTMLChildren(root)
        }
        if (!children) return null
        return jsx('element', attrs, !children.length ? [{ text: '' }] : children)
      }
    }
  }

  // deserialize text elements
  return deserializeText(root)
}
export const normalizeResult = (result: Descendant[], url?: string) => {
  const inlineElementTypeSet = new Set(
    Array.from(EditorTypeToElementMap.values())
      .filter(i => i.isInline)
      .map(i => i.type)
  )
  inlineElementTypeSet.add('link')
  inlineElementTypeSet.add('sup')

  // first walk, remove start whitespace and end whitespace
  let res = result.map(i => {
    i.children?.forEach((c, idx, arr) => {
      if (idx === 0 && Text.isText(c)) {
        c.text = c.text.trimStart()
      }
      if (idx === arr.length - 1 && Text.isText(c)) {
        c.text = c.text.trimEnd()
      }
    })
    return i
  })
  // second walk, remove text block and wrap inline block
  res = res.map(i => {
    if (!i.type) {
      return null
    }
    if (inlineElementTypeSet.has(i.type)) {
      return {
        type: 'paragraph',
        id: Id.getId(),
        children: [i]
      }
    }
    return {
      ...i,
      id: Id.getId()
    }
  })
  if (url) {
    console.log(url, window.location)
    const origin = new URL(url).origin
    try {
      // third walk, replace relative url to absolute url
      // chrome will always return absolute path to document url
      // https://github.com/angular/protractor/issues/2735
      Array.from(SlateNode.elements({ children: res })).forEach(e => {
        const ele = e[0]
        console.log(ele)
        // @ts-ignore
        if (ele.type === 'link' && ele.url) {
          if (ele.url.startsWith(window.location.href)) {
            const replaced = ele.url.replace(window.location.href, '/')
            const newU = new URL(replaced, origin)
            console.log(newU)
            ele.url = newU.toString()
          }
        }
      })
    } catch (e) {
      console.error(e)
    }
  }
  return res
}
export const deserializeHTMLChildren = (node: HTMLElement) => {
  const res = Array.from(node.childNodes)
    .map(n => deserializeHTML(n))
    .flat()
    .filter(i => i !== null)
  return res
}
export default deserializeHTML
