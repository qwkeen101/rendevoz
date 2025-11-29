import { MetaStore } from '@/api/stores'
import getInsideMetas from '@/core/components/editor/utils/getInsideMetas'
import { waitFor } from '@/utils'
import { IWebpageInstance } from '~/typings'

export default async (parentId: number, targetId: number) => {
  const parent = MetaStore.getCachedMetaObject(parentId)
  const target = MetaStore.getCachedMetaObject(targetId)
  console.log(parent, target)
  if (target?.type === 'message') {
    const parentType = parent?.type
    if (parentType === 'pdf' || parentType === 'webpage' || parentType === 'note' || parentType === 'video' || parentType === 'audio') {
      Global.layoutOps?.openObject<'editor'>(parentId).then(async ins => {
        if (parent?.type === 'webpage') {
          ;(ins as IWebpageInstance).editorInstance?.aiOps?.scrollToMessage(target.objectId!)
        } else {
          ins?.aiOps?.scrollToMessage(target.objectId!)
        }
      })
      return
    }
  }
  if (parent) {
    switch (parent.type) {
      case 'whiteboard': {
        Global.layoutOps?.openObject<'whiteboard'>(parentId).then(ins => {
          console.log(ins)
          ins?.moveToMetaNode?.(targetId, {
            select: true
          })
        })
        break
      }
      case 'note': {
        Global.layoutOps?.openObject<'editor'>(parentId).then(async ins => {
          const v = ins?.getSlateEditor?.().children
          if (v) {
            const metas = getInsideMetas(v)
            if (metas[targetId]) {
              const blocks = metas[targetId]
              ins?.scrollToBlock?.({ blockId: blocks[0], highlight: true })
            }
          }
        })
        break
      }
      case 'chat': {
        Global.layoutOps?.openObject<'chat'>(parentId).then(ins => {
          const target = MetaStore.getCachedMetaObject(targetId)
          if (target && target.objectId) {
            ins?.scrollToMessage?.(target.objectId)
          }
        })
        break
      }
      case 'group': {
        Global.layoutOps?.openObject<'group'>(parentId).then(ins => {
          waitFor(
            () => !!ins?.bodyOps?.scrollToMeta,
            () => {
              ins?.bodyOps?.scrollToMeta?.(targetId, true)
            }
          )
        })
        break
      }
      default: {
        Global.layoutOps?.openObject(targetId)
      }
    }
  }
}
