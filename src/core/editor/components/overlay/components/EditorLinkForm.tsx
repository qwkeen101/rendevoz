import { Button, Content, Icon, Tooltip, WithBorder } from '@/components'
import { CustomTransforms } from '@/core/editor/utils/transform'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CustomEditor } from '~/typings'
import { EditorOverlayManager } from '../useEditorOverlay'
import { GlobalObjectPanelInstance, ReactEditor } from '@/core'
import { GlobalEventEmitter } from '@/events'
import { Editor, Text, Transforms } from 'slate'
import getCursorPosition from '@/core/editor/utils/getCursorPosition'
import FontSize from '@/consts/font'
import { ClassName } from 'rendevoz'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { MetaStore } from '@/api/stores'

const EditorLinkForm = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const [link, setLink] = useState('')
  manager.setCurrentLink = s => {
    console.log(s)
    setLink(s)
  }
  const handlerInsertLink = () => {
    const aboveNode = Editor.above(editor)
    const selected = CustomTransforms.getSelectedText(editor)
    manager.close()
    const finalLink = link.startsWith('https') || link.startsWith('http') || link.startsWith('rendevoz') ? link : 'https://' + link
    console.log(aboveNode)
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
    <WithBorder style={{ padding: '4px 12px' }}>
      <Content flex gap={10}>
        <input
          autoFocus={true}
          onChange={e => {
            setLink(e.target.value)
          }}
          style={{
            border: 'none',
            width: 200,
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
          placeholder="Input Link"
        ></input>
        {/*<Tooltip content="Link object">*/}
        {/*  <Icon*/}
        {/*    className={ClassName.circleButton()}*/}
        {/*    name="park-share-one"*/}
        {/*    onClick={() => {*/}
        {/*      manager.close()*/}
        {/*      const cursorPosition = getCursorPosition(editor)*/}
        {/*      if (!cursorPosition) return*/}
        {/*      GlobalObjectPanelInstance.open?.({*/}
        {/*        left: cursorPosition.x + 20,*/}
        {/*        top: cursorPosition.y + 20*/}
        {/*      })*/}

        {/*      GlobalEventEmitter()*/}
        {/*        .emitWithCallback('global', {*/}
        {/*          type: 'globalChooseMetaObject'*/}
        {/*        })*/}
        {/*        .then(id => {*/}
        {/*          const lin = `rendevoz://object/${id}`*/}
        {/*          const selected = CustomTransforms.getSelectedText(editor)*/}
        {/*          const aboveNode = Editor.above(editor)*/}
        {/*          if (aboveNode?.[0].type === 'link') {*/}

        {/*            Transforms.setNodes(*/}
        {/*              editor,*/}
        {/*              {*/}
        {/*                url: lin*/}
        {/*              },*/}
        {/*              {*/}
        {/*                at: aboveNode[1]*/}
        {/*              }*/}
        {/*            )*/}
        {/*            return*/}
        {/*          }*/}
        {/*          if (selected?.length) {*/}
        {/*            CustomTransforms.replaceSelectedNode(editor, {*/}
        {/*              type: 'link',*/}
        {/*              url: lin,*/}
        {/*              children: [*/}
        {/*                {*/}
        {/*                  text: selected*/}
        {/*                }*/}
        {/*              ]*/}
        {/*            })*/}
        {/*          } else {*/}
        {/*            MetaStore.getMetaObjectById(id).then(m => {*/}
        {/*              if (!m) return*/}
        {/*              if (!editor.selection) return*/}
        {/*              const before = Editor.previous(editor)*/}
        {/*              const parent = Editor.parent(editor, editor.selection)*/}
        {/*              let path = undefined*/}
        {/*              if (!((before === undefined || Text.isText(before[0])) && parent[0].type !== 'link')) {*/}
        {/*                path = Editor.after(editor, editor.selection)*/}
        {/*              }*/}
        {/*              Transforms.insertNodes(*/}
        {/*                editor,*/}
        {/*                {*/}
        {/*                  type: 'link',*/}
        {/*                  url: lin,*/}
        {/*                  children: [{ text: m.name || 'Unnamed Object' }]*/}
        {/*                },*/}
        {/*                {*/}
        {/*                  at: path*/}
        {/*                }*/}
        {/*              )*/}
        {/*              const p = Editor.after(editor, editor.selection)*/}
        {/*              if (p) {*/}
        {/*                Transforms.select(editor, p)*/}
        {/*              }*/}
        {/*              ReactEditor.focus(editor)*/}
        {/*            })*/}
        {/*          }*/}
        {/*        })*/}
        {/*    }}*/}
        {/*  />*/}
        {/*</Tooltip>*/}
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
