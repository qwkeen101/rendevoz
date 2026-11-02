import { WithBorder } from '@/components/base'
import { ReactEditor } from '@/core'
import { CustomEditor, CustomElement } from '~/typings'
import { useEffect, useRef } from 'react'
import { Editor, Path, Transforms } from 'slate'
import { EditorOverlayManager } from '../overlay/useEditorOverlay'
import { useTranslation } from 'react-i18next'
import useEditorInstance from '../hooks/useEditorInstance'
import { useUpdate } from 'react-use'
import { Menu } from '@/components'
import GetEditorTransformMenu from '../components/overlay/components/getEditorTransformMenu'
import { IMenuLayoutItem } from '@/components/base/menu'
import toast from 'react-hot-toast'
import getExpandMetaMenu from '../components/blockMenu/getMetaMenu'
import getIframeMenu from '../components/blockMenu/getIframeMenu'
import getMenuDisplayOption from '../components/blockMenu/getMenuDisplayOption'
import EditorColorPicker from '../components/EditorColorPicker'

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
    instance.selectOps?.deselectAll()
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
    <WithBorder ref={containerRef} style={{ padding: '0.4rem 0', minWidth: 200, userSelect: 'none' }}>
      <Menu.NavigationMenu
        layout={
          [
            {
              key: 'delete',
              text: t('general.delete'),
              type: 'item',
              icon: 'park-delete-one',
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
                      <EditorColorPicker
                        color={currentEle?.color}
                        background={currentEle?.background}
                        onColorChange={c => {
                          handleMutateProps({ color: c })
                        }}
                        onBackgroundChange={c => {
                          handleMutateProps({ background: c })
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
              text: selected.size > 1 ? t('general.Copy links to all') : t('editor.Copy link to block'),
              onSelect: () => {
                instance.blockOps?.copyLink()
                instance.selectOps?.deselectAll()
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
