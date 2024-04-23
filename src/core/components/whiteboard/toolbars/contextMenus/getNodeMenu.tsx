import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { IMenuLayoutItem } from '@/components/base/menu'
import { WhiteboardDefaultKeyboardShortcut } from '@/core/components/whiteboard/hooks/keyboard/DefaultWhiteboardShortcuts'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import { defaultBgColor } from '@/components/picker/colorPicker'
import { GlobalInstance } from '@/hooks'
import { TFunction } from 'i18next'
import getContextMenu from '@/core/components/whiteboard/toolbars/contextMenus/getContextMenu'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import getVisibleNodeMenuItems from '@/core/components/whiteboard/toolbars/contextMenus/getVisibleNodeMenuItems'
import { WhiteboardNodeMenuItems } from '@/core/components/whiteboard/toolbars/contextMenus/items'
import { getSetting } from '@/core'

export default (
  instance: IWhiteboardInstance,
  t: TFunction<'translation', undefined, 'translation'>,
  toolbarType?: 'contextMenu' | 'click'
): IMenuLayoutItem[] => {
  const selected = instance.selectOps?.getSelectedNodes()
  // some nodes can't be folded or expanded
  const canExpandOrFold = selected?.length && selected.some(i => instance.nodeOps?.canExpand(i))
  const showExpandIcon = selected?.length && selected.some(i => instance.nodeOps?.canExpand(i) && !i.expanded)
  if (!selected?.length) return null
  const menuItem = WhiteboardNodeMenuItems(instance, selected)
  const selectedIds = selected.map(i => i.id)
  // click on group head
  const ifContextMenuOnSingleGroup = selected.length === 1 && selected[0].type === 'group'
  const metaMap = MetaStore.getMetaObjectsMap()
  const menuItems = getVisibleNodeMenuItems(selected)
  const setting = getSetting()
  const hasWebpageMetas = selected.some(i => i.type === 'metaObject' && i.expanded && metaMap.get(i.metaObjectId)?.type === 'webpage')
  const commonTools: (IMenuLayoutItem | undefined)[] = [
    ...(ifContextMenuOnSingleGroup
      ? [
          toolbarType !== 'click'
            ? {
                type: 'item',
                key: 'create-on-group',
                text: t('whiteboard.Create new card'),
                icon: 'park-plus',
                subMenuStyle: {
                  minWidth: 200
                },
                subMenu: [...getContextMenu(instance, t)]
              }
            : undefined,
          {
            type: 'item',
            key: 'renameGroup',
            icon: 'park-edit',
            text: t('whiteboard.Rename group'),
            onSelect: () => {
              instance.groupOps?.renameGroup(selected[0].id)
              instance.toolbarOps?.closeToolbar()
            }
          },
          {
            type: 'item',
            key: 'export-group-image',
            text: t('general.Export as image'),
            icon: 'park-download-four',
            onSelect: () => {
              instance.selectOps?.deselectAll()
              setTimeout(() => {
                instance.groupOps?.exportGroupImage(selected[0].id)
              }, 10)
            }
          },
          { type: 'separator' }
        ]
      : []),
    hasWebpageMetas
      ? {
          type: 'item',
          key: 'show-original-webpage',
          icon: Rendevoz.Utils.Object.getMetaObjectIcon('webpage'),
          text: t('general.Show original webpage'),
          onSelect: async () => {
            instance.toolbarOps?.closeToolbar()
            instance.selectOps?.deselectAll()
            const allWebpages = selected
              .filter(i => i.type === 'metaObject' && metaMap.get(i.metaObjectId)?.type === 'webpage')
              .map(i => metaMap.get(i.metaObjectId))
              .map(i => i?.objectId)
              .filter(i => i) as number[]
            allWebpages.forEach(i => ObjectStore('webpage').updateOne({ id: i, showOriginal: true }))
          }
        }
      : undefined,
    menuItems.isText
      ? {
          type: 'item',
          key: 'turn-into-document',
          icon: Rendevoz.Utils.Object.getMetaObjectIcon('note'),
          text: t('whiteboard.Turn into document card'),
          onSelect: async () => {
            instance.toolbarOps?.closeToolbar()
            instance.selectOps?.deselectAll()
            const currentText = selected[0] as IWhiteboardNode & { type: 'text' }
            const note = await NoteStore.initializeNoteWithValue(currentText.content)
            const noteMeta = await MetaStore.addMetaObject({ name: 'Untitled', objectId: note.id, type: 'note' })
            // instance.deleteNode?.(selected[0].id)
            instance.updateNode?.(selected[0].id, s => ({
              ...s,
              x: selected[0].x,
              y: selected[0].y,
              type: 'metaObject',
              metaObjectId: noteMeta.id,
              expanded: true
            }))
          }
        }
      : undefined,
    selected.length === 1
      ? {
          type: 'item',
          key: 'draw-line',
          icon: 'park-arrow-right-up',
          text: t('whiteboard.Draw connection'),
          suffix: WhiteboardDefaultKeyboardShortcut.DrawLine.text,
          onSelect: () => {
            instance.edgeOps?.startDrawEdge(selected[0].id)
            instance.toolbarOps?.closeToolbar()
          }
        }
      : undefined,
    {
      type: 'item',
      key: 'fitIntoView',
      icon: 'park-focus-one',
      text: t('whiteboard.Fit into view'),
      suffix: WhiteboardDefaultKeyboardShortcut.FitIntoView.text,
      onSelect: () => {
        instance.containerOps?.fitToSelected()
        instance.toolbarOps?.closeToolbar()
      }
    },
    ...(canExpandOrFold
      ? [
          {
            key: 'expand',
            type: 'item',
            text: !showExpandIcon
              ? t('whiteboard.Fold')
              : setting.whiteboard.expandToFixedSize
              ? t('whiteboard.Expand to fixed height')
              : t('whiteboard.Expand'),
            icon: !showExpandIcon ? 'park-click-to-fold' : 'park-full-screen-one',
            suffix: WhiteboardDefaultKeyboardShortcut.Expand.text,
            onSelect: () => {
              if (showExpandIcon) {
                instance.nodeOps?.expand(selectedIds)
              } else {
                instance.nodeOps?.fold(selectedIds)
              }
              setTimeout(() => {
                instance.selectOps?.resetSelectionBox()
              }, 100)
              instance.toolbarOps?.closeToolbar()
            }
          }
        ].filter(i => i)
      : []),
    {
      type: 'item',
      key: 'fit-into-content',
      text: t('whiteboard.Fit to content'),
      icon: 'park-auto-height-one',
      suffix: WhiteboardDefaultKeyboardShortcut.FitToContent.text,
      onSelect: () => {
        if (selected?.length) {
          instance.nodeOps?.fitContent(selected?.map(i => i.id))
        }
        instance.toolbarOps?.closeToolbar()
      }
    },
    {
      type: 'item',
      key: 'highlight-related',
      text: t('whiteboard.Highlight related cards'),
      suffix: WhiteboardDefaultKeyboardShortcut.HighlightRelated.text,
      icon: 'park-circular-connection',
      onSelect: () => {
        if (selected?.length) {
          instance.nodeOps?.highlightRelatedEdgesAndNodes(selected?.map(i => i.id))
        }
        instance.toolbarOps?.closeToolbar()
      }
    },
    {
      type: 'item',
      key: 'background-color',
      icon: 'park-background-color',
      text: t('general.Background color'),
      popOver: {
        key: 'bg-color',
        node: (
          <BlockColorPicker
            showBg={true}
            showFont={false}
            onPickBackgroundColor={v => {
              instance.toolbarOps?.closeToolbar()
              const selected = instance.selectOps?.getSelectedNodes()
              if (selected?.length) {
                instance.updateWhiteboard?.(w => {
                  selected.forEach(n => {
                    w.nodes?.set(n.id, {
                      ...n,
                      background: v === defaultBgColor ? undefined : v
                    })
                  })
                }, true)
              }
            }}
          />
        )
      }
    },
    menuItems.showMindmapConnection ? menuItem.MindmapLineOptions : undefined,
    menuItems.showBorderType ? menuItem.BorderOptions : undefined,
    ...(menuItems.showGroupOptions
      ? [
          {
            type: 'separator'
          },
          {
            type: 'item',
            key: 'create-group',
            text: t('whiteboard.Create group'),
            icon: 'custom-group',
            suffix: WhiteboardDefaultKeyboardShortcut.Group.text,
            onSelect: () => {
              if (selected?.length) {
                instance.groupOps?.groupNodes(selectedIds)
              }
              instance.toolbarOps?.closeToolbar()
            }
          },
          menuItems.showAlignPackOptions
            ? {
                type: 'item',
                key: 'align',
                text: t('whiteboard.Align cards'),
                icon: 'park-left-alignment',
                subMenu: [
                  {
                    icon: 'park-align-horizontally',
                    key: 'horizontallyCenter',
                    type: 'item',
                    text: t('whiteboard.Align horizontally center'),
                    onSelect: () => {
                      if (selected?.length) {
                        instance.layoutOps?.alignNodes(selected, 'horizontallyCenter')
                      }
                      instance.toolbarOps?.closeToolbar()
                    }
                  },
                  {
                    icon: 'park-align-vertically',
                    key: 'verticallyCenter',
                    type: 'item',
                    text: t('whiteboard.Align vertically center'),
                    onSelect: () => {
                      if (selected?.length) {
                        instance.layoutOps?.alignNodes(selected, 'verticallyCenter')
                      }
                      instance.toolbarOps?.closeToolbar()
                    }
                  },
                  {
                    icon: 'park-align-left',
                    key: 'left',
                    type: 'item',
                    text: t('whiteboard.Align left'),
                    onSelect: () => {
                      if (selected?.length) {
                        instance.layoutOps?.alignNodes(selected, 'left')
                      }
                      instance.toolbarOps?.closeToolbar()
                    }
                  },

                  {
                    icon: 'park-align-right',
                    key: 'right',
                    type: 'item',
                    text: t('whiteboard.Align right'),
                    onSelect: () => {
                      if (selected?.length) {
                        instance.layoutOps?.alignNodes(selected, 'right')
                      }
                      instance.toolbarOps?.closeToolbar()
                    }
                  },
                  {
                    icon: 'park-align-top',
                    key: 'top',
                    type: 'item',
                    text: t('whiteboard.Align top'),
                    onSelect: () => {
                      if (selected?.length) {
                        instance.layoutOps?.alignNodes(selected, 'top')
                      }
                      instance.toolbarOps?.closeToolbar()
                    }
                  },
                  {
                    icon: 'park-align-bottom',
                    key: 'bottom',
                    type: 'item',
                    text: t('whiteboard.Align bottom'),
                    onSelect: () => {
                      if (selected?.length) {
                        instance.layoutOps?.alignNodes(selected, 'bottom')
                      }
                      instance.toolbarOps?.closeToolbar()
                    }
                  }
                ]
              }
            : undefined,
          menuItems.showAlignPackOptions
            ? {
                type: 'item',
                key: 'arrange',
                text: t('whiteboard.Distribute cards'),
                icon: 'park-waterfalls-v',
                subMenu: [
                  {
                    icon: 'park-horizontal-tidy-up',
                    key: 'horizontallySpacing',
                    text: t('whiteboard.Distribute horizontally'),
                    type: 'item',
                    onSelect: () => {
                      if (selected?.length) {
                        instance.layoutOps?.layoutNodes(selected, 'horizontallySpacing')
                      }
                      instance.toolbarOps?.closeToolbar()
                    }
                  },
                  {
                    icon: 'park-vertical-tidy-up',
                    key: 'verticallySpacing',
                    text: t('whiteboard.Distribute vertically'),
                    type: 'item',
                    onSelect: () => {
                      if (selected?.length) {
                        instance.layoutOps?.layoutNodes(selected, 'verticallySpacing')
                      }
                      instance.toolbarOps?.closeToolbar()
                    }
                  },
                  {
                    icon: 'park-waterfalls-h',
                    key: 'pack',
                    text: t('whiteboard.Pack layout'),
                    type: 'item',
                    onSelect: () => {
                      if (selected?.length) {
                        instance.layoutOps?.packNodes(selected)
                      }
                      instance.toolbarOps?.closeToolbar()
                    }
                  },
                  {
                    icon: 'park-grid-nine',
                    key: 'auto'
                  }
                ]
              }
            : undefined
        ].filter(i => i)
      : []),
    {
      type: 'separator'
    },
    ...(menuItems.showMetaOptions
      ? [
          {
            type: 'item',
            key: 'open-in',
            icon: 'park-efferent-three',
            text: t('general.Open in'),
            subMenu: [
              ...(instance.nodeOps?.canExpand(selected[0])
                ? [
                    {
                      type: 'item',
                      key: 'open-in-side-peek',
                      text: t('general.Open in side peek'),
                      suffix: WhiteboardDefaultKeyboardShortcut.OpenInSidebar.text,
                      onSelect: () => {
                        instance.nodeOps?.open(selected[0].id, 'sidePeek')
                        instance.toolbarOps?.closeToolbar()
                      }
                    },
                    {
                      type: 'item',
                      key: 'open-in-center',
                      text: t('general.Open in center'),
                      suffix: WhiteboardDefaultKeyboardShortcut.OpenInCenter.text,
                      onSelect: () => {
                        instance.nodeOps?.open(selected[0].id, 'center')
                        instance.toolbarOps?.closeToolbar()
                      }
                    },
                    {
                      type: 'item',
                      key: 'open-in-float',
                      text: t('general.Open in float'),
                      suffix: WhiteboardDefaultKeyboardShortcut.OpenInFloat.text,
                      onSelect: () => {
                        instance.nodeOps?.open(selected[0].id, 'float')
                        instance.toolbarOps?.closeToolbar()
                      }
                    }
                  ]
                : []),
              {
                type: 'item',
                key: 'open-in-new-tab',
                text: t('general.Open in new tab'),
                suffix: WhiteboardDefaultKeyboardShortcut.OpenInNewTabs.text,
                onSelect: () => {
                  instance.nodeOps?.open(selected[0].id, 'newTab')
                  instance.toolbarOps?.closeToolbar()
                }
              }
            ]
          },
          {
            type: 'item',
            key: 'view-details',
            text: t('general.View details'),
            suffix: WhiteboardDefaultKeyboardShortcut.ViewDetails.text,
            icon: 'park-info',
            onSelect: () => {
              const item = selected[0].type === 'metaObject' && selected[0].metaObjectId
              item && GlobalInstance.metaOps?.openDetails(item)
              instance.toolbarOps?.closeToolbar()
            }
          },
          {
            type: 'item',
            key: 'move-to',
            suffix: WhiteboardDefaultKeyboardShortcut.MoveTo.text,
            text: t('general.Move to'),
            icon: 'park-corner-up-right',
            onSelect: () => {
              const item = selected[0].type === 'metaObject' && selected[0].metaObjectId
              item && GlobalInstance.metaOps?.quickAdd(item)
              instance.toolbarOps?.closeToolbar()
            }
          },
          {
            type: 'item',
            key: 'edit-meta',
            text: t('general.edit'),
            icon: 'park-edit',
            suffix: WhiteboardDefaultKeyboardShortcut.Edit.text,
            onSelect: () => {
              const item = selected[0].type === 'metaObject' && selected[0].metaObjectId
              item && Rendevoz.Actions.Open.Meta.openEditMetaDialog(item)
              instance.toolbarOps?.closeToolbar()
            }
          }
        ]
      : []),
    selected.length > 1 && selected.some(i => i.type === 'metaObject')
      ? {
          type: 'item',
          key: 'move-to',
          text: t('general.Move to'),
          icon: 'park-corner-up-right',
          suffix: WhiteboardDefaultKeyboardShortcut.MoveTo.text,
          onSelect: () => {
            const items = selected.filter(i => i.type === 'metaObject')
            if (items.length) {
              GlobalInstance.metaOps?.quickAdd(items.map(i => i.metaObjectId))
            }
            instance.toolbarOps?.closeToolbar()
          }
        }
      : undefined,
    {
      type: 'item',
      key: 'copy',
      text: t('general.Copy'),
      suffix: WhiteboardDefaultKeyboardShortcut.Copy.text,
      icon: 'park-copy',
      onSelect: () => {
        if (selected?.length) {
          instance.nodeOps?.copy(instance.nodeOps?.extendNodes(selected).map(i => i.id))
        }
        instance.toolbarOps?.closeToolbar()
      }
    },
    {
      type: 'item',
      key: 'delete',
      text: t('general.delete'),
      suffix: WhiteboardDefaultKeyboardShortcut.Delete.text,
      icon: 'park-delete',
      onSelect: () => {
        if (selected?.length) {
          instance.nodeOps?.deleteNode(selected?.map(i => i.id))
          setTimeout(() => {
            instance.selectOps?.resetSelectionBox()
          })
        }
        instance.toolbarOps?.closeToolbar()
      }
    }
  ].filter(i => i)
  return commonTools
}
