import { AnimatePopover, Content, Icon, WithBorder } from '@/components/base'
import { ReactEditor } from '@/core'
import { CustomEditor, CustomElement } from '~/typings'
import ClassName from '@/styles/classNames'
import { useRef, useState } from 'react'
import { Editor, Transforms } from 'slate'
import { EditorOverlayManager } from '../useEditorOverlay'
import BlockColorPicker from '../../BlockColorPicker'
import { useTranslation } from 'react-i18next'
import { defaultBgColor } from '@/components/picker/colorPicker'
import useEditorInstance from '@/core/editor/hooks/useEditorInstance'

const EditorBlockDetails = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const [styleVisible, setStyleVisible] = useState(false)
  const [formatVisible, setFormatVisible] = useState(false)
  const { t } = useTranslation()
  const currentEle = editor.currentAddClickElement
  const currentElePath = ReactEditor.findPath(editor, currentEle)
  const containerRef = useRef<HTMLDivElement>(null)
  const instance = useEditorInstance()
  let showColor = true
  let showBorderColor = false
  if (currentEle) {
    switch (currentEle.type) {
      case 'code-block':
        showColor = false
        break
      case 'highlight-block':
        showBorderColor = true
    }
  }
  const handleMutateProps = (newProps: Partial<CustomElement>) => {
    const selected = instance.values.selectedBlocks
    if (selected.size > 0) {
      const hasPath = Array.from(selected.values()).filter(i => i.pathRef)
      hasPath.forEach(p => {
        const path = p.pathRef!.current
        if (path) {
          Transforms.setNodes(editor, newProps, {
            at: path
          })
        }
      })
    } else {
      Transforms.setNodes(editor, newProps, {
        at: currentElePath
      })
    }
  }

  const handleDeleteElement = () => {
    const selected = instance.values.selectedBlocks
    if (selected.size > 0) {
      // delete all
      if (instance.values.selectingAll) {
        instance.values.selectingAll = false
        selected.forEach(v => {
          v.pathRef?.unref()
        })
        selected.clear()
        Transforms.removeNodes(editor, {
          at: Editor.range(editor, [0], [editor.children.length - 1])
        })
      }
      const hasPaths = Array.from(selected.values()).filter(i => i.pathRef)

      if (hasPaths.length) {
        Editor.withoutNormalizing(editor, () => {
          hasPaths.forEach(i => {
            const current = i.pathRef?.current
            i.pathRef?.unref()
            if (current) {
              Transforms.removeNodes(editor, {
                at: current
              })
            }
          })
        })
        selected.clear()
      }
    }else{
      Transforms.removeNodes(editor, {
        at: currentElePath
      })
    }
    manager.close()
  }
  return (
    <WithBorder ref={containerRef} style={{ padding: 6, minWidth: 160, userSelect: 'none' }}>
      <AnimatePopover
        containerStyle={{ zIndex: '10000' }}
        positions={['right']}
        align="start"
        visible={formatVisible}
        parentElement={containerRef.current || document.body}
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
                handleMutateProps({ align: 'left' })
              }}
              className={ClassName.flatButton()}
            >
              {t('editor.align left')}
            </div>
            <div
              onClick={() => {
                handleMutateProps({ align: 'center' })
                Transforms.setNodes(editor, { align: 'center' }, { at: currentElePath })
              }}
              className={ClassName.flatButton()}
            >
              {t('editor.align center')}
            </div>
            <div
              onClick={() => {
                handleMutateProps({ align: 'right' })
                Transforms.setNodes(editor, { align: 'right' }, { at: currentElePath })
              }}
              className={ClassName.flatButton()}
            >
              {t('editor.align right')}
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
            {t('editor.text alignment')}
          </Content>
          <Icon name="park-right" />
        </Content>
      </AnimatePopover>
      {showColor && (
        <AnimatePopover
          containerStyle={{ zIndex: '10000' }}
          positions={['bottom', 'top']}
          align="end"
          visible={styleVisible}
          parentElement={containerRef.current || document.body}
          disableIntersection
          reposition
          onClickOutside={() => setStyleVisible(false)}
          content={
            <BlockColorPicker
              showMoreFontOption
              showMoreBgOption
              showBorder={showBorderColor}
              onPickBorderColor={c => {
                handleMutateProps({ borderColor: c === defaultBgColor ? undefined : c })
              }}
              onPickFontColor={c => {
                handleMutateProps({ color: c === '#000000' ? undefined : c })
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
                handleMutateProps({ background: c === '#ffffff' ? undefined : c })
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
              {t('general.color')}
            </Content>
            <Icon name="park-right" />
          </Content>
        </AnimatePopover>
      )}
      <Content
        flex
        gap={10}
        alignItems="center"
        className={ClassName.flatButton()}
        onClick={() => {
          handleDeleteElement()
          manager.close()
        }}
      >
        <Icon name="park-delete" size={18} />
        {t('general.delete')}
      </Content>
    </WithBorder>
  )
}
export default EditorBlockDetails
