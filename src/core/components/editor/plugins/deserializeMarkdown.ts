import { Descendant } from 'slate'
import showdown from 'showdown'
import deserializeHTML, { deserializeOptions } from '@/core/components/editor/plugins/transformHTML/deserializeHTML'

const markdownToHTMLConverter = new showdown.Converter({
  tables: true,
  simplifiedAutoLink: true
})

function textNodesUnder(el: HTMLElement) {
  const children = [] // Type: Node[]
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    children.push(walker.currentNode)
  }
  return children
}
export const deserializeMarkdown = (text: string, opts?: deserializeOptions): Descendant[] => {
  const html = markdownToHTMLConverter.makeHtml(text)
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const textNodes = textNodesUnder(parsed.body)
  // wrap text nodes in span, equal to html parser behavior
  textNodes.forEach(node => {
    const span = document.createElement('span')
    node.after(span)
    if (node.textContent) {
      node.textContent = node.textContent.trim()
    }
    span.appendChild(node)
  })

  const deserialized = deserializeHTML(parsed.body, opts) || []
  return deserialized
}
export const deserializeMarkdownFile = async (file: File): Promise<Descendant[] | undefined> => {
  if (!file.name.endsWith('md')) {
    throw new Error('Wrong file type!')
  }
  const text = await file.text()
  return deserializeMarkdown(text)
}
