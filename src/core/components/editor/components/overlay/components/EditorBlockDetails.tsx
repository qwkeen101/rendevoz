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
import { Menu } from '@/components'
import GetEditorTransformMenu from '@/core/components/editor/components/overlay/components/getEditorTransformMenu'
import { IMenuLayoutItem } from '@/components/base/menu'
import toast from 'react-hot-toast'

const EditorBlockDetails = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const { t } = useTranslation()
  const currentEle = editor.currentAddClickElement
  const currentElePath = ReactEditor.findPath(editor, currentEle)
  const containerRef = useRef<HTMLDivElement>(null)
  const instance = useEditorInstance()
  const update = useUpdate()
  const selected = instance.values.selectedBlocks
  useEffect(() => {
    update()
  }, [])
  let showColor = true
  let showBorderColor = false
  let showFontColor = true
  if (currentEle) {
    switch (currentEle.type) {
      case 'code-block': {
        showFontColor = false
        break
      }
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
    instance.overlayOps?.close()
  }

  const handleDeleteElement = () => {
    instance.blockOps?.deleteBlock(currentElePath)
    manager.close()
  }
  const transformMenu = GetEditorTransformMenu(t => {
    handleMutateProps({ type: t })
  })
  return (
    <WithBorder ref={containerRef} style={{ padding: '0.25rem 0', minWidth: 180, userSelect: 'none' }}>
      <Menu.NavigationMenu
        layout={
          [
            {
              key: 'delete',
              text: t('general.delete'),
              type: 'item',
              icon: 'park-delete',
              onSelect: () => {
                handleDeleteElement()
                instance.overlayOps?.close()
              }
            },
            {
              key: 'duplicate',
              text: t('general.Duplicate'),
              type: 'item',
              icon: 'park-copy',
              onSelect: () => {
                instance.blockOps?.duplicateSelectedBlocks()
                instance.overlayOps?.close()
              }
            },
            {
              key: 'align',
              text: t('editor.text alignment'),
              icon: 'park-align-text-left',
              type: 'item',
              subMenu: [
                {
                  key: 'align left',
                  text: t('editor.align left'),
                  icon: 'park-align-text-left',
                  type: 'item',
                  onSelect: () => handleMutateProps({ align: 'left' })
                },
                {
                  key: 'align center',
                  text: t('editor.align center'),
                  icon: 'park-align-text-center',
                  type: 'item',
                  onSelect: () => handleMutateProps({ align: 'center' })
                },
                {
                  key: 'align right',
                  text: t('editor.align right'),
                  icon: 'park-align-text-right',
                  type: 'item',
                  onSelect: () => handleMutateProps({ align: 'right' })
                }
              ]
            },
            {
              key: 'transform',
              text: t('editor.turn block into'),
              icon: 'park-change',
              type: 'item',
              subMenu: transformMenu
            },
            showColor
              ? {
                  key: 'color',
                  text: t('general.color'),
                  type: 'item',
                  icon: 'park-format-brush',
                  popOver: {
                    key: 'colorPop',
                    node: (
                      <BlockColorPicker
                        showFont={showFontColor}
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
                    )
                  }
                }
              : undefined,
            {
              type: 'separator'
            },
            {
              key: 'copyLink',
              type: 'item',
              icon: 'park-link-one',
              text: selected.size > 1 ? t('general.Copy links to all') : t('general.Copy link to block'),
              onSelect: () => {
                instance.blockOps?.copyLink()
                toast.success(t('general.link is generated for this object'))
                instance.overlayOps?.close()
              }
            }
          ].filter(i => i) as IMenuLayoutItem[]
        }
      />
    </WithBorder>
  )
}
export default EditorBlockDetails
