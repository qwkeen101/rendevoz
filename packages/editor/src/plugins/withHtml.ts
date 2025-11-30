import { Node, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { CustomEditor } from '~/typings'
import deserializeHTML from './transformHTML/deserializeHTML'
import Id from '../utils/id'
import { deserializeMarkdown } from './deserializeMarkdown'
import { getSlateFragmentAttribute } from '../slate-react/utils/dom'
export interface WithHtmlOptions {
  onFileUpload?: (file: File) => Promise<string>
}

const withHtml = (editor: CustomEditor, options: WithHtmlOptions = {}) => {
  const { insertData } = editor
  const insertImage = (url: string) => {
    Transforms.insertNodes(editor, {
      type: 'image',
      url,
      id: Id.getId(),
      children: [{ text: '' }]
    })
  }
  const handleImageFile = (file: File | null) => {
    if (!file) return
    const uploadPromise = options.onFileUpload?.(file)
    if (uploadPromise) {
      uploadPromise.then(url => {
        if (url) {
          insertImage(url)
        }
      })
      return
    }
    const path = 'path' in file ? (file as File & { path?: string }).path : undefined
    if (path) {
      insertImage(`file://${path}`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        insertImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  editor.insertData = data => {
    const html = data.getData('text/html')
    const plainText = data.getData('text/plain')
    const imageItem = Array.from(data.items).find(i => i.type.startsWith('image'))
    if (imageItem) {
      const blob = imageItem.getAsFile()
      const file = blob ? (blob instanceof File ? blob : new File([blob], 'pasted-image', { type: blob.type })) : null
      handleImageFile(file)
      return
    }
    const imageFile = Array.from(data.files).find(i => i.type.startsWith('image'))
    if (imageFile) {
      handleImageFile(imageFile)
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
