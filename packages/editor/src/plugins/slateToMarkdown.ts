import { CustomElement } from 'rendevoz'
import { Descendant, Node, Text } from 'slate'
import { TableRowElement } from '~/typings'

export type SlateToMarkdownOptions = {
  metaObjects?: Map<number, { name?: string; placeholderName?: string }>
  defaultCodeLanguage?: string
  resolveFileUrl?: (url: string) => string
  fileBasePath?: string
}

export const slateToMarkdown = (value: (CustomElement | Descendant)[], options: SlateToMarkdownOptions = {}) => {
  const normalizedOptions: Required<Omit<SlateToMarkdownOptions, 'resolveFileUrl'>> & {
    resolveFileUrl?: SlateToMarkdownOptions['resolveFileUrl']
  } = {
    metaObjects: options.metaObjects ?? new Map(),
    defaultCodeLanguage: options.defaultCodeLanguage ?? 'typescript',
    fileBasePath: options.fileBasePath ?? '',
    resolveFileUrl: options.resolveFileUrl
  }
  let content = ''
  value.forEach((_, idx) => {
    const s = parseNode(idx, value, normalizedOptions)
    content += s
  })
  return content
}

const resolveImageUrl = (url: string, options: SlateToMarkdownOptions) => {
  if (options.resolveFileUrl) {
    return options.resolveFileUrl(url)
  }
  if (options.fileBasePath && url.startsWith('rendefile://')) {
    return `file://${options.fileBasePath}${url.replace('rendefile://', '')}`
  }
  return url
}

const formatMetaLink = (id: number | undefined, options: SlateToMarkdownOptions) => {
  if (id === undefined) return ''
  const meta = options.metaObjects?.get(id)
  if (!meta) return ''
  return `[${meta.name || meta.placeholderName || 'meta'}](rendevoz://object/${id})`
}

const parseNode = (idx: number, eles: CustomElement[], options: SlateToMarkdownOptions) => {
  const ele = eles[idx] as CustomElement
  let str = ''
  if (ele.type === 'columnList') {
    ele.children.forEach(i => {
      if ('type' in i && 'children' in i && Array.isArray(i.children) && i.type === 'column') {
        i.children.forEach((o, _idx) => {
          const s = parseNode(_idx, i.children, options)
          str += s
        })
      }
    })
    return str
  }
  if (ele.type === 'table') {
    const rows = ele.children
    const transformRow = (row: TableRowElement) => {
      let s = '|'
      row.children.forEach(cell => {
        s += ' ' + Node.string(cell) + ' |'
      })
      return s
    }
    rows.forEach((row, idx) => {
      const s = transformRow(row)
      str += `${s}\n`
      if (idx === 0) {
        str += '|'
        row.children.forEach(i => {
          const s = Node.string(i)
          Array.from(Array(Math.max(3, s.length + 2))).forEach(() => {
            str += '-'
          })
          str += '|'
        })
        str += '\n'
      }
    })
    return str
  }

  if (ele.type?.startsWith('heading')) {
    switch (ele.type) {
      case 'heading-one':
        str += '# '
        break
      case 'heading-two':
        str += '## '
        break
      case 'heading-three':
        str += '### '
        break
      case 'heading-four':
        str += '#### '
        break
      case 'heading-five':
        str += '##### '
        break
      case 'heading-six':
        str += '###### '
        break
    }
  }
  if (ele.type === 'metaObject') {
    str += formatMetaLink(ele.originId, options)
  }
  if (ele.type === 'math') {
    str += `$${ele.content}$`
    return str
  }
  if (ele.type === 'math-block') {
    return `$$${ele.content}$$\n`
  }
  if (ele.type === 'block-quote') {
    str += '> '
  }
  if (ele.type === 'list-item') {
    let preSpace = 0
    if (ele.level) {
      preSpace = ele.level * 4
    }
    str += '- '
    if (preSpace) {
      for (let i = 0; i < preSpace; i++) {
        str = ' ' + str
      }
    }
  }
  if (ele.type === 'code-block') {
    const language = ele.language || options.defaultCodeLanguage || 'typescript'
    str += '```' + language + '\n'
    if ('children' in ele && Array.isArray(ele.children)) {
      ele.children.forEach((c, idx) => {
        str += parseNode(idx, ele.children, options)
      })
    }
    str += '```\n'
    return str
  }
  if (ele.type === 'image') {
    const imageUrl = resolveImageUrl(ele.url, options)
    str += `![image](${imageUrl})`
  }
  if (ele.type === 'order-list-item') {
    const order = getOrderOfNode(idx, eles)
    str += `${order}. `
    let preSpace = 0
    if (ele.level) {
      preSpace = ele.level * 4
    }
    if (preSpace) {
      for (let i = 0; i < preSpace; i++) {
        str = ' ' + str
      }
    }
  }
  if (ele.type === 'link') {
    return `[${Node.string(ele)}](${ele.url})`
  }
  if (ele.type === 'inline-metaObject') {
    str += formatMetaLink(ele.originId, options)
  }
  if (Text.isText(ele)) {
    let text = Node.string(ele)
    if (ele.bold) {
      text = `**${text}**`
    }
    if (ele.italic) {
      text = `*${text}*`
    }
    if (ele.underline) {
      text = `<u>${text}</u>`
    }
    str += text
    return str
  }
  if ('children' in ele && Array.isArray(ele.children)) {
    ele.children.forEach((c, idx) => {
      str += parseNode(idx, ele.children, options)
    })
  }
  return str + '\n'
}

const getOrderOfNode = (idx: number, eles: CustomElement[]) => {
  const curr = eles[idx] as CustomElement
  let prevIdx = idx - 1
  let prev = eles[prevIdx]
  let prevNum = 0
  while (prev && (prev.type === 'order-list-item' || prev.type === 'list-item') && (prev.level ?? 0) === (curr.level ?? 0)) {
    if (prev.type === 'order-list-item') {
      prevNum += 1
    }
    prevIdx -= 1
    prev = eles[prevIdx]
  }
  return prevNum + 1
}
