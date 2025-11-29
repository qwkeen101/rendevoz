import { Node, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { CustomEditor } from '~/typings'
import deserializeHTML from './transformHTML/deserializeHTML'
import Id from '@/utils/id'
import FileSystem from '@/api/fileSystem'
import { deserializeMarkdown } from '@/core/components/editor/plugins/deserializeMarkdown'
import { getSlateFragmentAttribute } from '@/core/components/editor/slate-react/utils/dom'
const withHtml = (editor: CustomEditor) => {
  const { insertData } = editor

  editor.insertData = data => {
    const html = data.getData('text/html')
    const plainText = data.getData('text/plain')
    const imageItem = Array.from(data.items).find(i => i.type.startsWith('image'))
    if (imageItem) {
      const blob = imageItem.getAsFile()
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (result) {
          FileSystem.saveImage(result).then(p => {
            Transforms.insertNodes(editor, {
              type: 'image',
              url: p,
              id: Id.getId(),
              children: [{ text: '' }]
            })
          })
        }
      }
      reader.readAsDataURL(blob)
      return
    }
    const imageFile = Array.from(data.files).find(i => i.type.startsWith('image'))
    if (imageFile && imageFile.path) {
      Transforms.insertNodes(editor, {
        type: 'image',
        url: `file://${imageFile.path}`,
        id: Id.getId(),
        children: [{ text: '' }]
      })
      return
    }
    if (html) {
      const slateFragment = getSlateFragmentAttribute(html)
      if (slateFragment) {
        const decoded = decodeURIComponent(window.atob(slateFragment))
        const parsed = JSON.parse(decoded) as Node[]
        Transforms.insertFragment(editor, parsed)
        return
      }
      const parsed = new DOMParser().parseFromString(html, 'text/html')
      const deserialized = deserializeHTML(parsed.body)
      if (deserialized?.length) {
        Transforms.insertFragment(editor, deserialized)
        return
      } else {
        if (!plainText?.length) {
          const t = parsed.textContent
          Transforms.insertText(editor, t)
          return
        }
      }
    }
    if (plainText) {
      if (isHTML(plainText)) {
        Transforms.insertText(editor, plainText)
        return
      }
      Transforms.insertFragment(editor, deserializeMarkdown(plainText))
      return
    }
    insertData(data)
  }

  return editor
}

function isHTML(str: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(str, 'text/html')
  return doc.body.innerHTML !== ''
}

export default withHtml
