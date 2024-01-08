import { Content, WithBorder } from '@/components'
import { CustomTransforms } from '@/core/components/editor/utils/transform'
import { useEffect, useRef, useState } from 'react'
import { CustomEditor } from '~/typings'
import { EditorOverlayManager } from '../useEditorOverlay'
import { ReactEditor } from '@/core'
import { Editor, Text, Transforms } from 'slate'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import MetaFilterer, { isValidUrl } from '@/core/object/filter/MetaFilterer'

const EditorLinkForm = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const [link, setLink] = useState('')
  const instance = useEditorInstance()
  manager.setCurrentLink = s => {
    console.log(s)
    setLink(s)
  }
  const inputRef = useRef()
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])
  const handlerInsertLink = (currentL?: string) => {
    const aboveNode = Editor.above(editor)
    const selected = CustomTransforms.getSelectedText(editor)
    instance.overlayOps?.close()
    const finalLink = currentL || link
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
    <WithBorder style={{ padding: 4 }}>
      <Content
        style={{
          margin: '4px 4px 8px'
        }}
      >
        <input
          ref={inputRef}
          autoFocus={true}
          onChange={e => {
            setLink(e.target.value)
          }}
          style={{
            border: '1px solid var(--border-background)',
            borderRadius: 4,
            width: '100%',
            fontSize: 13,
            padding: '2px 8px',
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
          placeholder="Paste link or search objects"
        ></input>
      </Content>
      <MetaFilterer
        withInput={false}
        mode={'recentlyCreate'}
        onInputLink={l => {
          if (isValidUrl(l)) {
            handlerInsertLink(l.startsWith('http://') ? l : 'http://' + l)
            return
          }
          handlerInsertLink()
        }}
        onChange={metaId => {
          if (metaId) {
            editor.on({ type: 'linkToMeta', targetMetaId: metaId })
            handlerInsertLink('rendevoz://object/' + metaId)
          }
        }}
        showCreate={{ linkToWeb: true, note: false, linkToWebMeta: true, whiteboard: false }}
        currentInput={link}
      />
    </WithBorder>
  )
}

export default EditorLinkForm
