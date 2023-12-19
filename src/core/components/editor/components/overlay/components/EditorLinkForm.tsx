import { Content, Icon, WithBorder } from '@/components'
import { CustomTransforms } from '@/core/components/editor/utils/transform'
import { useState } from 'react'
import { CustomEditor } from '~/typings'
import { EditorOverlayManager } from '../useEditorOverlay'
import { ReactEditor } from '@/core'
import { Editor, Text, Transforms } from 'slate'
import FontSize from '@/consts/font'
import { ClassName } from 'rendevoz'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

const EditorLinkForm = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const [link, setLink] = useState('')
  const instance = useEditorInstance()
  manager.setCurrentLink = s => {
    console.log(s)
    setLink(s)
  }
  const handlerInsertLink = () => {
    const aboveNode = Editor.above(editor)
    const selected = CustomTransforms.getSelectedText(editor)
    instance.overlayOps?.close()
    const finalLink = link
    if (aboveNode?.[0].type === 'link') {
      Transforms.setNodes(
        editor,
        {
          url: finalLink
        },
        {
          at: aboveNode[1]
        }
      )
      return
    }

    if (selected?.length) {
      CustomTransforms.replaceSelectedNode(editor, {
        type: 'link',
        url: finalLink,
        children: [
          {
            text: selected
          }
        ]
      })
    } else {
      if (!editor.selection) return
      const before = Editor.previous(editor)
      const parent = Editor.parent(editor, editor.selection)

      let path = undefined
      if (!((before === undefined || Text.isText(before[0])) && parent[0].type !== 'link')) {
        path = Editor.after(editor, editor.selection)
      }

      Transforms.insertNodes(
        editor,
        {
          type: 'link',
          url: finalLink,
          children: [{ text: link }]
        },
        {
          at: path
        }
      )
      const p = Editor.after(editor, editor.selection)
      if (p) {
        Transforms.select(editor, p)
      }
      ReactEditor.focus(editor)
    }
  }
  return (
    <WithBorder
      style={{ padding: '4px 12px' }}
    >
      <Content flex gap={10}>
        <input
          autoFocus={true}
          onChange={e => {
            setLink(e.target.value)
          }}
          style={{
            border: 'none',
            width: 300,
            fontSize: FontSize['12px'],
            background: 'transparent'
          }}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              handlerInsertLink()
              e.stopPropagation()
              e.preventDefault()
            }
          }}
          value={link}
          placeholder="Type link URL..."
        ></input>
        <Icon
          className={ClassName.circleButton()}
          name="park-check"
          onClick={() => {
            handlerInsertLink()
          }}
        />
      </Content>
    </WithBorder>
  )
}

export default EditorLinkForm
