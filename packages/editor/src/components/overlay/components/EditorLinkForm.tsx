import { WithBorder } from '@/components'
import { CustomTransforms } from '../utils/transform'
import { useLayoutEffect, useRef, useState } from 'react'
import { CustomEditor } from '~/typings'
import { EditorOverlayManager } from '../useEditorOverlay'
import { ReactEditor } from '@/core'
import { Editor, Text, Transforms } from 'slate'
import useEditorInstance from '../hooks/useEditorInstance'
import MetaFilterer, { isValidUrl } from '@/core/object/filter/MetaFilter'
import { useTranslation } from 'react-i18next'

const EditorLinkForm = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const [link, setLink] = useState('')
  const instance = useEditorInstance()
  const { t } = useTranslation()
  manager.setCurrentLink = s => {
    console.log(s)
    setLink(s)
  }
  const inputRef = useRef()
  useLayoutEffect(() => {
    instance.highlightCurrentSelection?.()
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    return () => {
      instance.dehighlightSelection?.()
    }
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
    console.log(selected)
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
      console.log(path, before, parent)
      let linkName = link
      if (!linkName) {
        linkName = finalLink
      }
      Transforms.insertNodes(
        editor,
        {
          type: 'link',
          url: finalLink,
          children: [{ text: linkName }]
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
    <WithBorder>
      <div
        style={{
          padding: '8px'
        }}
        className={'border-bottom'}
      >
        <input
          ref={inputRef}
          autoFocus={true}
          onChange={e => {
            setLink(e.target.value)
          }}
          className={'border-box-shadow rounded-md w-full px-2 py-1 focus-input'}
          value={link}
          placeholder={t('editor.Paste link or search')}
        ></input>
      </div>
      <MetaFilterer
        withInput={false}
        onInputLink={l => {
          if (isValidUrl(l)) {
            handlerInsertLink(l.startsWith('http://') || l.startsWith('https://') ? l : 'https://' + l)
            return
          }
          handlerInsertLink()
        }}
        onChange={metaId => {
          if (metaId) {
            instance.on({
              type: 'getMeta',
              onSuccess: id => {
                MetaStore.addMetaLink({
                  sourceId: id,
                  targetId: metaId
                })
              }
            })
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
