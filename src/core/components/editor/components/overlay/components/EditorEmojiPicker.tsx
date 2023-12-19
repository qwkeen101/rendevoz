import { WithBorder } from '@/components'
import { CustomEditor } from '~/typings'
import EmojiPicker from '@/components/picker/emojiPicker'
import { useLayoutEffect } from 'react'
import { Transforms } from 'slate'
import { ReactEditor } from '../../../slate-react'
import { EditorOverlayManager } from '../useEditorOverlay'

const EditorEmojiPicker = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
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
