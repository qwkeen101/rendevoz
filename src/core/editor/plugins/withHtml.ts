import { Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { CustomEditor } from '~/typings'
import { deserializeHTML, normalize } from './deserializeHtml'

const withHtml = (editor: CustomEditor) => {
  const { insertData } = editor

  editor.insertData = data => {
    const html = data.getData('text/html')
    const slateFragment = data.getData('application/x-slate-fragment')
    const plainText = data.getData('text/plain')
    console.log(plainText, slateFragment, data)
    if (slateFragment) {
      ReactEditor.insertFragmentData(editor, data)
      // Transforms.deselect(editor)
      return
    }
    if (html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html')
      const deserialized = deserializeHTML(parsed.body)
      console.log(deserialized)
      const normalized = normalize(deserialized)
      Transforms.insertFragment(editor, normalized)
      return
    }
    insertData(data)
  }

  return editor
}

export default withHtml
