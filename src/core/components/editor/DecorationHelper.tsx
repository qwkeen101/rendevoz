import { memo } from 'react'
import { Editor, Element, Node, NodeEntry, Path } from 'slate'
import { CustomElement } from '~/typings'
import Prism from 'prismjs'
import { GlobalSetting, useSlate } from '@/core'
import { CustomText } from '~/typings/components/editor/baseTypes'

const mergeMaps = <K, V>(...maps: Map<K, V>[]) => {
  const map = new Map<K, V>()

  for (const m of maps) {
    for (const item of m) {
      map.set(...item)
    }
  }

  return map
}
const normalizeTokens = (tokens: (string | Prism.Token)[], parent?: Prism.Token): typeof tokens => {
  let normalized: (string | Prism.Token)[] = []
  tokens.forEach(token => {
    if (typeof token === 'string') {
      if (parent) {
        normalized.push({ type: parent.type, content: token, length: token.length } as Prism.Token)
      } else {
        normalized.push(token)
      }
    } else {
      if (Array.isArray(token.content)) {
        normalized = [...normalized, ...normalizeTokens(token.content, token)]
      } else {
        normalized.push(token)
      }
    }
  })
  return normalized
}
type ElementWithDetails = { start: number; text: string; element: CustomText; end: number }[]
const getChildNodeToDecorations = ([block, blockPath]: NodeEntry<CustomElement & { type: 'code-block' }>, lang?: string) => {
  let language = block.language || lang
  if (language === 'html') {
    language = 'markup'
  }
  if (!Prism.languages[language]) return
  const nodeToDecorations = new Map<CustomElement, Range[]>()
  const elements = block.children as CustomText[]
  const elementWithDetails: ElementWithDetails = []
  elements.forEach(ele => {
    const prev = elementWithDetails[elementWithDetails.length - 1]
    const str = Node.string(ele)
    elementWithDetails.push({
      element: ele,
      start: prev?.end ?? 0,
      end: (prev?.end ?? 0) + str.length,
      text: str
    })
  })
  const text = elementWithDetails.map(e => e.text).join('')

  if (!text) return
  const tokens = normalizeTokens(Prism.tokenize(text, Prism.languages[language]))
  console.log(tokens)
  let start = 0
  let eleIndex = 0
  let offsetStart = 0
  let prevEnd = 0
  for (let index = 0; index < tokens.length; index++) {
    const { element: elementDetails, currentIndex } = loopFindTargetElement(elementWithDetails, eleIndex, start)
    if (currentIndex !== eleIndex) {
      eleIndex = currentIndex
      offsetStart = 0
    }
    if (prevEnd) {
      console.log(prevEnd, tokens[index])
      if (tokens[index] !== '\n') {
        offsetStart += prevEnd
      }
      prevEnd = 0
    }
    if (!elementDetails) break
    const element = elementDetails.element
    const token = tokens[index]
    if (!nodeToDecorations.has(element)) {
      nodeToDecorations.set(element, [])
    }
    if (typeof token === 'string') {
      start += token.length
      offsetStart += token.length
      continue
    }
    const length = token.content.length
    if (!length) {
      continue
    }

    const end = offsetStart + length

    const path = [...blockPath, eleIndex]
    const realEnd = Math.min(end, elementDetails.text.length)
    if (realEnd < end) {
      const offset = end - realEnd
      const left = loopNextElements(elementWithDetails, eleIndex, offset, nodeToDecorations, blockPath, token)
      if (left) {
        prevEnd = left
      }
    }
    const range = {
      anchor: { path, offset: offsetStart },
      focus: { path, offset: realEnd },
      token: true,
      [token.type]: true
    }
    nodeToDecorations.get(element)!.push(range)
    start += length
    offsetStart += length
  }
  return nodeToDecorations
}
const loopFindTargetElement = (elementWithDetails: ElementWithDetails, currentIndex: number, start: number) => {
  const curr = elementWithDetails[currentIndex]
  if (curr && start >= curr.end && elementWithDetails[currentIndex + 1]) {
    currentIndex += 1
    return loopFindTargetElement(elementWithDetails, currentIndex, start)
  }
  return {
    element: curr,
    currentIndex
  }
}
const loopNextElements = (
  elementWithDetails: ElementWithDetails,
  currentIndex: number,
  endOffset: number,
  nodeToDecorations: Map<CustomElement, Range[]>,
  blockPath: Path,
  token: any
): number | undefined => {
  const nextElement = elementWithDetails[currentIndex + 1]
  if (nextElement) {
    const nextElementLength = nextElement.text.length
    const currOffset = Math.min(nextElementLength, endOffset)
    nodeToDecorations.set(nextElement.element, [
      {
        anchor: { path: [...blockPath, currentIndex + 1], offset: 0 },
        focus: { path: [...blockPath, currentIndex + 1], offset: currOffset },
        token: true,
        [token.type]: true
      }
    ])
    if (currOffset < endOffset) {
      return loopNextElements(elementWithDetails, currentIndex + 1, endOffset - currOffset, nodeToDecorations, blockPath, token)
    }
    return currOffset
  }
}
export default memo(() => {
  const editor = useSlate()
  const defaultLang = GlobalSetting.useSelectSettingAtom('codeLang')
  const blockEntries = Array.from(
    Editor.nodes(editor, {
      at: [],
      mode: 'highest',
      match: n => Element.isElement(n) && n.type === 'code-block'
    })
  )
  const maps = blockEntries.map(n => getChildNodeToDecorations(n, defaultLang || 'typescript')).filter(i => i)
  const nodeToDecorations = maps.length ? mergeMaps(...maps) : new Map()

  editor.nodeToDecorations = nodeToDecorations

  return null
})
