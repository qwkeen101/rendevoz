import { CustomElement } from 'rendevoz'
import { Descendant, Node, Text } from 'slate'
import { globalStore } from '@/api/stores'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
import { getSetting, GlobalSetting } from '@/core'
import { TableRowElement } from '~/typings'

export const slateToMarkdown = (value: (CustomElement | Descendant)[]) => {
  let content = ''
  value.forEach((i, idx) => {
    const s = parseNode(idx, value)
    content += s
  })
  return content
}

const parseNode = (idx: number, eles: CustomElement[]) => {
  const ele = eles[idx] as CustomElement
  let str = ''
  if (ele.type === 'columnList') {
    ele.children.forEach(i => {
      if ('type' in i && 'children' in i && Array.isArray(i.children) && i.type === 'column') {
        i.children.forEach((o, _idx) => {
          const s = parseNode(_idx, i.children)
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
          Array.from(Array(Math.max(3, s.length + 2))).forEach(i => {
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
    if (ele.originId) {
      const meta = globalStore.get(metaObjectsAtom).get(ele.originId)
      if (meta) {
        str += `[${meta.name || meta.placeholderName}](rendevoz://object/${ele.originId})`
      }
    }
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
    const defaultLang = GlobalSetting.getSetting().code.defaultLanguage || 'typescript'
    str += '```' + (ele.language || defaultLang) + '\n'
    if ('children' in ele && Array.isArray(ele.children)) {
      ele.children.forEach((c, idx) => {
        str += parseNode(idx, ele.children)
      })
    }
    str += '```\n'
    return str
  }
  if (ele.type === 'image') {
    if (ele.url.startsWith('rendefile')) {
      const setting = getSetting()
      const filePath = setting.general.userFilePath
      const replacedFilePath = filePath + ele.url.replace('rendefile://', '')
      str += `![image](file://${replacedFilePath})`
    } else {
      str += `![image](${ele.url})`
    }
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
    if (ele.originId) {
      const meta = globalStore.get(metaObjectsAtom).get(ele.originId)
      if (meta) {
        str += `[${meta.name || meta.placeholderName}](rendevoz://object/${ele.originId})`
      }
    }
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
      str += parseNode(idx, ele.children)
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
