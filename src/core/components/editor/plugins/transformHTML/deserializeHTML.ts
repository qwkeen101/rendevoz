import deserializeSpan from './deserialize/deserializeSpan'
import { jsx } from 'slate-hyperscript'
import deserializeMedia from './deserialize/deserializeMedia'
import { WrapperNodeNames } from './consts'
import deserializeText from './deserialize/deserializeText'
import { ELEMENT_TAGS, TEXT_TAGS } from '@/core/components/editor/plugins/transformHTML/HTMLTags'
import deserializeLi from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeLi'
import { Descendant, Node as SlateNode, Text } from 'slate'
import { EditorTypeToElementMap } from '@/core/components/editor/maps'
import Id from '@/utils/id'
import deserializeTable from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeTable'
import deserializeLink from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeLink'
import deserializeWeixinAudio from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeWeixinAudio'
import { normalize } from './normalizeParsed'
import { isInline } from '@/core/components/editor/utils'
import wrapElementText from '@/core/components/editor/plugins/transformHTML/deserialize/wrapElementText'
import deserializePre from '@/core/components/editor/plugins/transformHTML/deserialize/deserializePre'
const NoNestedNodeNames = ['A', 'H1', 'H2', 'H3', 'HR', 'LI', 'H4', 'H5', 'H6', 'PRE', 'SUP', 'FIGCAPTION', 'BLOCKQUOTE']

function removeCommonPrefix(a: string, b: string) {
  // 确定两个字符串中较短的一个，避免索引越界
  let minLength = Math.min(a.length, b.length)
  let i = 0

  // 比较两个字符串，找到相同前缀的结束位置
  for (; i < minLength; i++) {
    if (a[i] !== b[i]) {
      break
    }
  }

  // 截取b字符串中除去相同前缀后的部分
  return b.slice(i)
}

export const deserializeRoot = (root: HTMLElement, opts?: deserializeOptions): Descendant[] | null => {
  // deserialize text node
  if (root.nodeType === Node.TEXT_NODE) {
    return deserializeText(root)
  }
  // if not text node and not element node, return null
  if (root.nodeType !== Node.ELEMENT_NODE) return null
  // wrapper, return fragment
  if (WrapperNodeNames.includes(root.nodeName)) {
    const c = deserializeHTMLChildren(root, {
      ...opts,
      wrapperType: root.nodeName === 'BLOCKQUOTE' ? 'block-quote' : undefined,
      wrap: true
    })
    return jsx('fragment', {}, c)
  }
  // deserialize specific nodes
  switch (root.nodeName) {
    case 'LI':
      return deserializeLi(root)
    case 'SPAN':
      return deserializeSpan(root)
    case 'MP-COMMON-MPAUDIO':
      return deserializeWeixinAudio(root)
    case 'BR':
      return null
    case 'PRE':
      return deserializePre(root)
    case 'A':
      return deserializeLink(root)
    case 'TABLE':
      return deserializeTable(root, opts)
    case 'IMG':
    case 'AUDIO':
    case 'IFRAME':
      return deserializeMedia(root)
    default: {
      if (ELEMENT_TAGS[root.nodeName]) {
        const attrs = ELEMENT_TAGS[root.nodeName](root)
        let children: any[] = []
        if (NoNestedNodeNames.includes(root.nodeName)) {
          children = wrapElementText(root)
        } else {
          children = deserializeHTMLChildren(root, opts)
        }
        if (!children) return null
        return jsx('element', attrs, !children.length ? [{ text: '' }] : children)
      }
    }
  }
  // text tags, but not text node
  if (TEXT_TAGS[root.nodeName]) {
    const children = wrapElementText(root)
    return jsx('fragment', {}, children)
  }
  return null
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
    const origin = new URL(url).origin
    try {
      // third walk, replace relative url to absolute url
      // chrome will always return absolute path to document url
      // https://github.com/angular/protractor/issues/2735
      Array.from(SlateNode.elements({ children: res })).forEach(e => {
        const ele = e[0]
        // @ts-ignore
        if (ele.url) {
          if (ele.url.startsWith(window.location.href)) {
            const replaced = ele.url.replace(window.location.href, '/')
            const newU = new URL(replaced, origin)
            ele.url = newU.toString()
          } else if (ele.url.startsWith(window.location.origin)) {
            const originU = new URL(ele.url)
            if (!originU.host) {
              const replaced = removeCommonPrefix(window.location.href, ele.url)
              const newU = new URL(replaced, origin)
              ele.url = newU.toString()
            } else {
              ele.url = ele.url.replace(window.location.origin, 'http://')
            }
          } else if (ele.url.startsWith('#')) {
            ele.url = url + ele.url
          }
        }
      })
    } catch (e) {
      console.error(e)
    }
  }
  return res
}
export const deserializeHTMLChildren = (node: HTMLElement, opts?: deserializeOptions & { wrapperType?: string; wrap?: boolean }) => {
  const res = Array.from(node.childNodes)
    .map(n => {
      const r = deserializeRoot(n, opts)
      return r
    })
    .flat()
    .filter(i => i !== null)

  const normalized = normalize(res)
  if (opts?.wrap) {
    return wrapElements(normalized, opts?.wrapperType)
  }
  return normalized
}

// wrap elements from [text,text,ele,text] to [ele: {children:[text,text]}, ele, ele: {children:[text]}]
// and filter out empty texts
export const wrapElements = (eles: Descendant[], wrapperType = 'paragraph', addPlaceholder?: boolean) => {
  const final: Descendant[] = []
  let wrapped: Descendant[] = []
  const sliced = eles.slice()
  const isEmptyWrapped = () => {
    if (wrapped.every(i => Text.isText(i) && !i.text.replace(/\s/g, ''))) {
      return true
    }
    return false
  }
  const cleanLastAndStartLinebreak = () => {
    const first = wrapped[0]
    // merge start line breaks and spaces into one space
    if (Text.isText(first)) {
      first.text = first.text.replace(/^[\s\t\r]+/, ' ')
    } else {
      const children = first.children
      const firstText = children[0]
      if (Text.isText(firstText)) {
        firstText.text = firstText.text.replace(/^[\s\t\r]+/, ' ')
      }
    }
    const last = wrapped[wrapped.length - 1]
    // remove last spaces and line breaks
    if (Text.isText(last)) {
      last.text = last.text.trimEnd()
    } else {
      const children = last.children
      const lastText = children[children.length - 1]
      if (Text.isText(lastText)) {
        lastText.text = lastText.text.trimEnd()
      }
    }
  }
  while (sliced.length) {
    const first = sliced.shift()
    if (Text.isText(first) || isInline(first)) {
      if (Text.isText(first) && !first.text.trim()) continue
      wrapped.push(first)
    } else {
      if (wrapped.length && !isEmptyWrapped()) {
        cleanLastAndStartLinebreak()
        final.push({
          type: wrapperType,
          id: Id.getId(),
          children: wrapped
        })
      }
      wrapped = []
      final.push(first)
    }
  }
  if (wrapped.length && !isEmptyWrapped()) {
    cleanLastAndStartLinebreak()
    final.push({
      type: wrapperType,
      id: Id.getId(),
      children: wrapped
    })
  }
  if (!wrapped.length && !final.length && addPlaceholder) {
    final.push({
      type: wrapperType,
      id: Id.getId(),
      children: [{ text: '' }]
    })
  }
  return final
}
export type deserializeOptions = {
  tableWidth?: number
  minTableCellWidth?: number
}
export default (root: HTMLElement, opts?: deserializeOptions) => {
  const res = deserializeRoot(root, opts)
  if (res) {
    console.log(root, wrapElements(res))
    return wrapElements(res)
  }
}
