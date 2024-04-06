import { WithBorder } from '@/components/base'
import { ReactEditor } from '@/core'
import { CustomEditor, CustomElement } from '~/typings'
import { useEffect, useRef } from 'react'
import { Editor, Path, Transforms } from 'slate'
import { EditorOverlayManager } from '../overlay/useEditorOverlay'
import BlockColorPicker from '../BlockColorPicker'
import { useTranslation } from 'react-i18next'
import { defaultBgColor } from '@/components/picker/colorPicker'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { useUpdate } from 'react-use'
import { Menu } from '@/components'
import GetEditorTransformMenu from '@/core/components/editor/components/overlay/components/getEditorTransformMenu'
import { IMenuLayoutItem } from '@/components/base/menu'
import toast from 'react-hot-toast'
import { Colors } from '@/consts'
import getExpandMetaMenu from '@/core/components/editor/components/blockMenu/getMetaMenu'
import getIframeMenu from '@/core/components/editor/components/blockMenu/getIframeMenu'
import getMenuDisplayOption from '@/core/components/editor/components/blockMenu/getMenuDisplayOption'

export type EditorBlockDisplayOptions =
  | 'copy link to original'
  | 'delete'
  | 'background'
  | 'turnInto'
  | 'duplicate'
  | 'copy link'
  | 'copy link to all'
const EditorBlockMenu = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const { t } = useTranslation()
  const currentEle = editor.currentAddClickElement
  const currentElePath = ReactEditor.findPath(editor, currentEle)
  const containerRef = useRef<HTMLDivElement>(null)
  const instance = useEditorInstance()
  const update = useUpdate()
  const displayOptions = getMenuDisplayOption(editor, instance)
  const selected = instance.values.selectedBlocks
  useEffect(() => {
    update()
  }, [])
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
    instance.overlayOps?.close()
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
            displayOptions.has('turnInto')
              ? {
                  key: 'transform',
                  text: t('editor.turn block into'),
                  icon: 'park-change',
                  type: 'item',
                  subMenu: transformMenu
                }
              : undefined,
            displayOptions.has('background')
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
                          handleMutateProps({ color: c === Colors.Font.Blank ? undefined : c })
                        }}
                        onPickBackgroundColor={c => {
                          handleMutateProps({ background: c === Colors.Background.Blank ? undefined : c })
                        }}
                      />
                    )
                  }
                }
              : undefined,
            ...getExpandMetaMenu(editor, instance),
            ...getIframeMenu(editor, instance),
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
                toast.success(t('general.Copied'))
                instance.overlayOps?.close()
              }
            }
          ].filter(i => i) as IMenuLayoutItem[]
        }
      />
    </WithBorder>
  )
}
export default EditorBlockMenu
