import { GlobalInstance } from '@/hooks'

export default async () => {
  const hasNodes = GlobalInstance.values.copiedWhiteboardData !== undefined
  const clipboardItems = await navigator.clipboard.read()
  const plainText = clipboardItems.find(i => i.types.includes('text/plain'))
  const html = clipboardItems.find(i => i.types.includes('text/html'))
  const image = clipboardItems.find(i => i.types.some(t => t.startsWith('image')))
  const displays = new Set<'nodes' | 'text' | 'image'>()
  if (plainText) {
    displays.add('text')
  }
  if (html) {
    const content = await html.getType('text/html').then(i => i.text())
    const dom = new DOMParser().parseFromString(content, 'text/html')
    if (dom.textContent?.length) {
      displays.add('text')
    }
  }
  if (hasNodes) {
    displays.add('nodes')
  }
  if (image) {
    displays.add('image')
  }
  return Array.from(displays.values())
}
