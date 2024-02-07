import { IWhiteboardInstance } from '~/typings'
import { TFunction } from 'i18next'
import { IMenuLayoutItem } from '@/components/base/menu'
import { WhiteboardDefaultKeyboardShortcut } from '@/core/components/whiteboard/hooks/keyboard/DefaultWhiteboardShortcuts'
import Id from '@/utils/id'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'

export default (instance: IWhiteboardInstance, t: TFunction<'translation', undefined, 'translation'>) => {
  const copiedElements = instance.values.copiedElements
  const handleAddMeta = () => {}
  const handleAddMetaObjectAtToolbarPoint = async (
    metaType: string,
    opts?: {
      fit?: boolean
      expand?: boolean
      select?: boolean
      showMetaModal?: boolean
    }
  ) => {
    const toolbarState = instance.toolbarOps?.getToolbarState()
    if (toolbarState && toolbarState.originX !== undefined && toolbarState.originY !== undefined) {
      instance.toolbarOps?.closeToolbar()
      const id = Id.getId()
      const meta = (await ObjectStore(metaType).addOneWithMeta({}, { silent: true, showMetaModal: opts?.showMetaModal })).meta
      const whiteboardObjId = instance.values.id
      if (whiteboardObjId) {
        const whiteboardMeta = MetaStore.getMetaObjectByObjectId(whiteboardObjId)
        if (whiteboardMeta) {
          MetaStore.addMetaLink({ sourceId: meta.id, targetId: whiteboardMeta.id })
        }
      }
      instance.insertNode?.({
        x: toolbarState.originX,
        y: toolbarState.originY,
        type: 'metaObject',
        metaObjectId: meta.id,
        expanded: opts?.expand ?? true,
        id
      })
      opts?.fit !== false &&
        instance.containerOps?.fitTo(
          {
            left: toolbarState.originX,
            top: toolbarState.originY,
            width: 520,
            height: 300
          },
          {
            maxScale: 1
          }
        )
      opts?.select !== false &&
        setTimeout(() => {
          const nodeFuncs = instance.nodeOps?.getNodeFuncs(id)
          if (nodeFuncs) {
            nodeFuncs.setNodeState(s => ({ ...s, selected: true, focused: true }))
          }
        }, 200)
    }
  }
  const items: IMenuLayoutItem[] = [
    ...(copiedElements.length
      ? [
          {
            type: 'item',
            key: 'paste',
            icon: 'park-clipboard',
            text: t('general.Paste'),
            suffix: WhiteboardDefaultKeyboardShortcut.Paste.text,
            onSelect: () => {
              const toolbarState = instance.toolbarOps?.getToolbarState()
              if (toolbarState && toolbarState.originX !== undefined && toolbarState.originY !== undefined) {
                instance.nodeOps?.paste({
                  x: toolbarState.originX,
                  y: toolbarState.originY
                })
                instance.toolbarOps?.closeToolbar()
              }
            }
          },
          {
            type: 'separator'
          }
        ]
      : []),
    {
      type: 'item',
      key: 'text',
      icon: 'park-text',
      text: t('whiteboard.Create text card'),
      onSelect: () => {
        const toolbarState = instance.toolbarOps?.getToolbarState()
        if (toolbarState && toolbarState.originX !== undefined && toolbarState.originY !== undefined) {
          const nodeId = Id.getId()
          instance.insertNode?.({
            x: toolbarState.originX,
            y: toolbarState.originY,
            type: 'text',
            width: 350,
            id: nodeId,
            content: [
              {
                type: 'paragraph',
                children: [{ text: '' }],
                id: Id.getId()
              }
            ]
          })
          instance.containerOps?.fitTo({
            left: toolbarState.originX,
            top: toolbarState.originY,
            width: 200,
            height: 30
          })
          setTimeout(() => {
            const nodeFuncs = instance.nodeOps?.getNodeFuncs(nodeId)
            if (nodeFuncs) {
              nodeFuncs.setNodeState(s => ({ ...s, selected: true, focused: true }))
            }
          }, 200)
          instance.toolbarOps?.closeToolbar()
        }
      }
    },
    // {
    //   type: 'item',
    //   key: 'mindmap',
    //   icon: 'park-mindmap-map',
    //   text: t('whiteboard.Create mindmap'),
    //   onSelect: async () => {
    //     const toolbarState = instance.toolbarOps?.getToolbarState()
    //     const nodeId = Id.getId()
    //     instance.insertNode?.({
    //       x: toolbarState.originX,
    //       y: toolbarState.originY,
    //       type: 'mindmap',
    //       width: 350,
    //       id: nodeId,
    //       rightChildren: [],
    //       leftChildren: []
    //     })
    //   }
    // },
    {
      type: 'item',
      key: 'card',
      icon: Rendevoz.Utils.Object.getMetaObjectIcon('note'),
      text: t('whiteboard.Create document card'),
      onSelect: async () => {
        await handleAddMetaObjectAtToolbarPoint('note')
      }
    },
    {
      type: 'item',
      key: 'webpage',
      icon: Rendevoz.Utils.Object.getMetaObjectIcon('webpage'),
      text: t('whiteboard.Create webpage card'),
      onSelect: async () => {
        await handleAddMetaObjectAtToolbarPoint('webpage', {
          showMetaModal: true,
          expand: false
        })
      }
    },
    {
      type: 'item',
      key: 'pdf',
      icon: Rendevoz.Utils.Object.getMetaObjectIcon('pdf'),
      text: t('whiteboard.Create pdf card'),
      onSelect: async () => {
        await handleAddMetaObjectAtToolbarPoint('pdf', {
          showMetaModal: true,
          expand: false
        })
      }
    },
    {
      type: 'item',
      key: 'video',
      icon: Rendevoz.Utils.Object.getMetaObjectIcon('video'),
      text: t('whiteboard.Create video card'),
      onSelect: async () => {
        await handleAddMetaObjectAtToolbarPoint('video', {
          showMetaModal: true,
          expand: false
        })
      }
    },
    {
      type: 'item',
      key: 'image',
      icon: Rendevoz.Utils.Object.getMetaObjectIcon('image'),
      text: t('whiteboard.Create image card'),
      onSelect: async () => {
        await handleAddMetaObjectAtToolbarPoint('image', {
          expand: false,
          showMetaModal: true
        })
      }
    }
    // {
    //   type: 'item',
    //   key: 'upload',
    //   icon: 'park-upload',
    //   text: t('whiteboard.Upload file'),
    //   onSelect: async () => {
    //     const toolbarState = instance.toolbarOps?.getToolbarState()
    //     if (toolbarState && toolbarState.originX !== undefined && toolbarState.originY !== undefined) {
    //       const note = (await ObjectStore('note').addOneWithMeta({}, { silent: true })).meta
    //       const id = Id.getId()
    //       instance.insertNode?.({
    //         x: toolbarState.originX,
    //         y: toolbarState.originY,
    //         type: 'metaObject',
    //         metaObjectId: note.id,
    //         expanded: true,
    //         id
    //       })
    //       instance.containerOps?.fitTo({
    //         left: toolbarState.originX,
    //         top: toolbarState.originY,
    //         width: 520,
    //         height: 50
    //       })
    //       setTimeout(() => {
    //         const nodeFuncs = instance.nodeOps?.getNodeFuncs(id)
    //         if (nodeFuncs) {
    //           nodeFuncs.setNodeState(s => ({ ...s, selected: true, focused: true }))
    //         }
    //       }, 200)
    //       instance.toolbarOps?.closeToolbar()
    //     }
    //   }
    // }
  ].filter(i => i) as IMenuLayoutItem[]
  return items
}
