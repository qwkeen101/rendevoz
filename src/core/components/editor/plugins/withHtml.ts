import { Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { CustomEditor } from '~/typings'
import { deserializeHTML, normalize } from './deserializeHtml'
import Id from '@/utils/id'
import FileSystem from '@/api/fileSystem'

const withHtml = (editor: CustomEditor) => {
  const { insertData } = editor

  editor.insertData = data => {
    const html = data.getData('text/html')
    const slateFragment = data.getData('application/x-rendevoz-slate-fragment')
    const plainText = data.getData('text/plain')
    const url = data.getData('text/uri-list')
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
      const parsed = new DOMParser().parseFromString(html, 'text/html')
      const deserialized = deserializeHTML(parsed.body)
      if (deserialized.length) {
        const normalized = normalize(deserialized)
        Transforms.insertFragment(editor, normalized)
        return
      }
    }
    if (slateFragment) {
      ReactEditor.insertFragmentData(editor, data)
      return
    }
    const linkPattern =
      /(^|[\s\n]|<[A-Za-z]*\/?>)((?:https?|ftp):\/\/[\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.]*[\-A-Z0-9+\u0026@#\/%=~()_|])/gi

    if (plainText) {
      const paragraphs = plainText.split(/[\r\n]+/)
      const texts = paragraphs
        .filter(i => i)
        .map(p => {
          const matched = p.match(linkPattern)
          if (matched?.length) {
            console.log(matched)
            return {
              type: 'paragraph',
              id: Id.getId(),
              children: matched.map(i => ({ type: 'link', url: i, children: [{ text: i }] }))
            }
          } else {
            return {
              type: 'paragraph',
              id: Id.getId(),
              children: [{ text: p }]
            }
          }
        })
      Transforms.insertFragment(editor, texts)
      return
    }
    insertData(data)
  }

  return editor
}

export default withHtml
