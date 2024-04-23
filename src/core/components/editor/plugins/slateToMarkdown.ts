import { CustomElement } from 'rendevoz'
import { Node, Text } from 'slate'
import { globalStore } from '@/api/stores'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
import { getSetting } from '@/core'
import { TableRowElement } from '~/typings'

export const slateToMarkdown = (value: CustomElement[]) => {
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
        str += `[${meta.name}](rendevoz://object/${ele.originId})`
      }
    }
  }
  if (ele.type === 'math') {
    str += ele.content
  }
  if (ele.type === 'block-quote') {
    str += '> '
  }
  if (ele.type === 'list-item') {
    str += '- '
  }
  if (ele.type === 'code-block') {
    if (ele.language) {
      str += '```' + ele.language + '\n'
    } else {
      str += '```\n'
    }

    str += ele.content
    str += '```'
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
  }
  if (ele.type === 'link') {
    str += `[${Node.string(ele)}](${ele.url})`
  }
  if (ele.type === 'inline-metaObject') {
    if (ele.originId) {
      const meta = globalStore.get(metaObjectsAtom).get(ele.originId)
      if (meta) {
        str += `[${meta.name}](rendevoz://object/${ele.originId})`
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
    str += text
  }
  if ('children' in ele && Array.isArray(ele.children)) {
    ele.children.forEach((c, idx) => {
      str += parseNode(idx, ele.children)
    })
  }
  return str + '\n'
}

const getOrderOfNode = (idx: number, eles: CustomElement[]) => {
  let prevIdx = idx - 1
  let prev = eles[prevIdx]
  let prevNum = 0
  while (prev && prev.type === 'order-list-item') {
    prevIdx -= 1
    prevNum += 1
    prev = eles[prevIdx]
  }
  return prevNum + 1
}
