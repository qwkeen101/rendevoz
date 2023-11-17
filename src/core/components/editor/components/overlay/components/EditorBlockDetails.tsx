import { AnimatePopover, Button, Content, Icon, WithBorder } from '@/components/base'
import { ReactEditor } from '@/core'
import { CustomEditor, CustomElement } from '~/typings'
import ClassName from '@/styles/classNames'
import { useEffect, useRef, useState } from 'react'
import { Editor, Path, Transforms } from 'slate'
import { EditorOverlayManager } from '../useEditorOverlay'
import BlockColorPicker from '../../BlockColorPicker'
import { useTranslation } from 'react-i18next'
import { defaultBgColor } from '@/components/picker/colorPicker'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { transformableTargetType } from '@/core/components/editor/hooks/instance/assignBlockOps'
import { EditorTypeToElementMap } from '@/core/components/editor/maps'
import { useUpdate } from 'react-use'

const EditorBlockDetails = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const { t } = useTranslation()
  const currentEle = editor.currentAddClickElement
  const currentElePath = ReactEditor.findPath(editor, currentEle)
  const containerRef = useRef<HTMLDivElement>(null)
  const instance = useEditorInstance()
  const update = useUpdate()
  useEffect(() => {
    update()
  }, [])
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
    const transformType = 'type' in newProps
    const allPaths: Path[] = []
    if (selected.size > 0) {
      const selectedElements = Array.from(selected.values())
        .map(i => i.element)
        .filter(i => i) as CustomElement[]
      const extended = instance.toggleOps?.extendElements(selectedElements)
      extended?.forEach(p => {
        allPaths.push(p[1])
      })
    } else {
      const currentEle = Editor.node(editor, currentElePath)
      const extended = instance.toggleOps?.extendElements([currentEle[0]])
      extended?.forEach(p => {
        allPaths.push(p[1])
      })
    }
    allPaths.forEach(path => {
      transformType
        ? instance.blockOps?.transformBlockType(path, newProps.type)
        : Transforms.setNodes(editor, newProps, {
            at: path
          })
    })
  }

  const handleDeleteElement = () => {
    instance.blockOps?.deleteBlock(currentElePath)
    manager.close()
  }

  const transformableBlocksPopover = () => {
    return (
      <Content flex column>
        {transformableTargetType.map(type => {
          const details = EditorTypeToElementMap.get(type)
          if (!details) return null
          return (
            <Button.IconButton
              icon={details.registerInMenu?.icon}
              onClick={() => {
                handleMutateProps({ type: type })
              }}
              text={typeof details.name === 'string' ? details.name : details.name()}
            />
          )
        })}
      </Content>
    )
  }
  return (
    <WithBorder ref={containerRef} style={{ padding: 6, minWidth: 160, userSelect: 'none' }}>
      <AnimatePopover
        positions={['right']}
        align="start"
        parentElement={containerRef.current || document.body}
        content={setVisible => (
          <WithBorder padding={6} width={160}>
            <Button.IconButton
              onClick={() => {
                setVisible(false)
                handleMutateProps({ align: 'left' })
              }}
              text={t('editor.align left')}
              icon={'park-align-text-left'}
            />
            <Button.IconButton
              onClick={() => {
                setVisible(false)
                handleMutateProps({ align: 'center' })
              }}
              text={t('editor.align center')}
              icon={'park-align-text-center'}
            />
            <Button.IconButton
              onClick={() => {
                setVisible(false)
                handleMutateProps({ align: 'right' })
              }}
              text={t('editor.align right')}
              icon={'park-align-text-right'}
            />
          </WithBorder>
        )}
      >
        <Button.IconButton text={t('editor.text alignment')} icon={'park-align-text-left'} suffixIcon={'park-right'} />
      </AnimatePopover>
      <AnimatePopover
        parentElement={containerRef.current || document.body}
        positions={['right', 'left']}
        align="start"
        content={
          <WithBorder padding={6} width={160}>
            {transformableBlocksPopover()}
          </WithBorder>
        }
      >
        <Button.IconButton icon={'park-change'} text={t('editor.turn block into')} suffixIcon={'park-right'} />
      </AnimatePopover>
      {showColor && (
        <AnimatePopover
          containerStyle={{ zIndex: '10000' }}
          positions={['bottom', 'top']}
          align="end"
          parentElement={containerRef.current || document.body}
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
          <Button.IconButton icon={'park-platte'} text={t('general.color')} suffixIcon={'park-right'} />
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
