import { CustomElement } from 'rendevoz'
import { Element, Node, Text } from 'slate'
import { globalStore } from '@/api/stores'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
import { getSetting } from '@/core'

export const slateToMarkdown = (value: CustomElement[]) => {
  let content = ''
  value.forEach((i, idx) => {
    const s = parseNode(idx, value)
    content += s
  })
  return content
}

const parseNode = (idx: number, eles: CustomElement[]) => {
  const ele = eles[idx]
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

  if (ele.type.startsWith('heading')) {
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
  if ('children' in ele && Array.isArray(ele.children)) {
    ele.children.forEach(c => {
      if (Element.isElement(c)) {
        if (c.type === 'link') {
          str += `[${Node.string(c)}](${c.url})`
        }
        if (c.type === 'inline-metaObject') {
          if (c.originId) {
            const meta = globalStore.get(metaObjectsAtom).get(c.originId)
            if (meta) {
              str += `[${meta.name}](rendevoz://object/${c.originId})`
            }
          }
        }
      }
      if (Text.isText(c)) {
        let text = Node.string(c)
        if (c.bold) {
          text = `**${text}**`
        }
        if (c.italic) {
          text = `*${text}*`
        }
        str += text
      }
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
