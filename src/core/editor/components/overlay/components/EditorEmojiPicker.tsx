import { WithBorder } from '@/components'
import { CustomEditor } from '~/typings'
import EmojiPicker from '@/components/picker/emojiPicker'
import { useLayoutEffect } from 'react'
import { Transforms } from 'slate'
import { ReactEditor } from '../../../slate-react'
import { EditorOverlayManager } from '../useEditorOverlay'

const EditorEmojiPicker = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  useLayoutEffect(() => {
    const { selection } = editor
    if (selection) {
      const domRange = ReactEditor.toDOMRange(editor, selection)
      const rect = domRange.getBoundingClientRect()
      manager.setPosition({
        left: rect.left,
        top: rect.top + 10
      })
    }
  }, [])
  return (
    <WithBorder style={{ width: 400, height: 400 }}>
      <EmojiPicker
        onPick={name => {
          Transforms.insertNodes(editor, {
            type: 'emoji',
            name,
            children: [{ text: '' }]
          })
        }}
      />
    </WithBorder>
  )
}

export default EditorEmojiPicker
