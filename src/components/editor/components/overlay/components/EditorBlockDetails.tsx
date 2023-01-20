import { AnimatePopover, Content, Icon, WithBorder } from '@/components/base'
import { ReactEditor } from '@/components/editor/slate-react'
import { CustomEditor } from '@/components/editor/types'
import moveSingleElement from '@/components/editor/utils/moveSingleElement'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { cloneElement, useRef, useState } from 'react'
import { Transforms } from 'slate'
import { EditorOverlayManager } from '../useEditorOverlay'
import BlockColorPicker from '../../BlockColorPicker'
import { useTheme } from '@/hooks'

const EditorBlockDetails = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const [cardViewVisible, setCardViewVisible] = useState(false)
  const [styleVisible, setStyleVisible] = useState(false)
  const [formatVisible, setFormatVisible] = useState(false)

  const currentEle = editor.currentAddClickElement
  const currentElePath = ReactEditor.findPath(editor, currentEle)
  const containerRef = useRef<HTMLDivElement>(null)
  let showCard = false
  const showCardElements = ['pdf', 'book-highlight', 'note', 'metaObject']
  const embedded = ['note', 'metaObject']
  if (currentEle) {
    if (showCardElements.includes(currentEle.type)) {
      showCard = true
    }
  }
  const cardEdit = [
    {
      name: 'Wide card',
      onClick: () => Transforms.setNodes(editor, { cardType: 'wide' }, { at: currentElePath })
    },
    {
      name: 'Slim card',
      onClick: () => Transforms.setNodes(editor, { cardType: 'slim' }, { at: currentElePath })
    },
    {
      name: 'Borderless card',
      onClick: () => Transforms.setNodes(editor, { cardType: 'line' }, { at: currentElePath })
    },
    currentEle?.type &&
      embedded.includes(currentEle.type) && editor.noteId !== currentEle?.noteId && {
        name: 'Embedded card',
        onClick: () => Transforms.setNodes(editor, { cardType: 'embedded' }, { at: currentElePath })
      }
  ]
  return (
    <WithBorder ref={containerRef} style={{ padding: 3, minWidth: 220, userSelect: 'none', color: '#5f6065' }}>
      {showCard && (
        <AnimatePopover
          containerStyle={{ zIndex: '10000' }}
          positions={['right']}
          align="start"
          visible={cardViewVisible}
          parentElement={containerRef.current}
          disableIntersection
          disableNudge
          onClickOutside={() => setCardViewVisible(false)}
          content={
            <WithBorder
              className={css({
                padding: 3,
                '> div': {
                  width: 130
                }
              })}
              onClick={e => e.currentTarget !== e.target && setCardViewVisible(false)}
            >
              {cardEdit.map(c =>
                cloneElement(
                  <Content key={c.name} />,
                  {
                    onClick: c.onClick,
                    className: ClassName.flatButton()
                  },
                  c.name
                )
              )}
            </WithBorder>
          }
        >
          <Content
            flex
            alignItems="center"
            justifyContent="space-between"
            className={ClassName.flatButton()}
            onClick={() => setCardViewVisible(!cardViewVisible)}
          >
            <Content flex centered gap={10}>
              <Icon name="park-id-card" size={18} />
              Card view
            </Content>
            <Icon name="park-right" />
          </Content>
        </AnimatePopover>
      )}
      <AnimatePopover
        containerStyle={{ zIndex: '10000' }}
        positions={['right']}
        align="start"
        visible={formatVisible}
        parentElement={containerRef.current}
        disableIntersection
        disableNudge
        onClickOutside={() => setFormatVisible(false)}
        content={
          <WithBorder
            style={{ padding: 3, width: 130 }}
            onClick={e => {
              if (e.target !== e.currentTarget) {
                setFormatVisible(false)
              }
            }}
          >
            <div
              onClick={() => {
                Transforms.setNodes(editor, { align: 'left' }, { at: currentElePath })
              }}
              className={ClassName.flatButton()}
            >
              Align left
            </div>
            <div
              onClick={() => {
                Transforms.setNodes(editor, { align: 'center' }, { at: currentElePath })
              }}
              className={ClassName.flatButton()}
            >
              Align center
            </div>
            <div
              onClick={() => {
                Transforms.setNodes(editor, { align: 'right' }, { at: currentElePath })
              }}
              className={ClassName.flatButton()}
            >
              Align right
            </div>
          </WithBorder>
        }
      >
        <Content
          flex
          alignItems="center"
          justifyContent="space-between"
          className={ClassName.flatButton()}
          onClick={() => setFormatVisible(!formatVisible)}
        >
          <Content flex centered gap={10}>
            <Icon name="park-align-text-left" size={18} />
            Text alignment
          </Content>
          <Icon name="park-right" />
        </Content>
      </AnimatePopover>
      <AnimatePopover
        containerStyle={{ zIndex: '10000' }}
        positions={['bottom']}
        align="end"
        visible={styleVisible}
        parentElement={containerRef.current}
        disableIntersection
        disableNudge
        onClickOutside={() => setStyleVisible(false)}
        content={
          <BlockColorPicker
            onPickFontColor={c => {
              Transforms.setNodes(
                editor,
                {
                  color: c === '#000000' ? undefined : c
                },
                {
                  at: currentElePath
                }
              )
            }}
            onPickBackgroundColor={c => {
              Transforms.setNodes(
                editor,
                {
                  background: c === '#ffffff' ? undefined : c
                },
                {
                  at: currentElePath
                }
              )
            }}
          />
        }
      >
        <Content
          flex
          justifyContent="space-between"
          alignItems="center"
          className={ClassName.flatButton()}
          onClick={() => setStyleVisible(!styleVisible)}
        >
          <Content flex centered gap={10}>
            <Icon name="park-platte" size={18} />
            Color
          </Content>
          <Icon name="park-right" />
        </Content>
      </AnimatePopover>
      <Content
        flex
        gap={10}
        alignItems="center"
        className={ClassName.flatButton()}
        onClick={() => {
          if (currentEle) {
            editor.currentCopyElement = currentEle
          }
          manager.close()
        }}
      >
        <Icon name="park-copy" size={18} />
        Copy
      </Content>
      <Content
        flex
        gap={10}
        alignItems="center"
        className={ClassName.flatButton()}
        onClick={() => {
          moveSingleElement(editor, currentElePath, editor.children[0], [0], 'top', false)
          Transforms.removeNodes(editor, { at: [0] })
          manager.close()
        }}
      >
        <Icon name="park-delete" size={18} />
        Delete
      </Content>
    </WithBorder>
  )
}
export default EditorBlockDetails
