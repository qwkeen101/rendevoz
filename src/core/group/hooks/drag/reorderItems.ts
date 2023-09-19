import { IGroupInstance, MetaGroupChild } from '~/typings'
import { ObjectStore } from '@/stores'
import { Path } from 'slate'
import { insertItems } from './insertItems'
import produce from 'immer'
import deleteItems from '@/core/group/hooks/drag/deleteItems'
import dragInnerMakeNewGroup from '@/core/group/hooks/drag/dragInnerMakeNewGroup'
/**
 * 在树中移动多个元素
 * 1. 首先删除要移动的元素
 */
const reorderDragItems = async (opts: {
  items: MetaGroupChild[]
  groupId: number
  instance: IGroupInstance
  targetValue: MetaGroupChild
  towards: 'top' | 'bottom' | 'inner'
}) => {
  const { towards, items, groupId, instance, targetValue } = opts
  const currentGroup = await ObjectStore('group').getOneById(groupId)
  const getPath = instance.pathOps?.getPathById
  if (currentGroup?.value && getPath) {
    const targetPath = getPath(targetValue.rowId)
    if (!targetPath) return

    items.sort((b, a) => (Path.isAfter(getPath(b.rowId)!, getPath(a.rowId)!) ? 1 : -1))
    const endPath = getPath(items[items.length - 1].rowId)
    const startPath = getPath(items[0].rowId)
    console.log(startPath, endPath, targetPath)
    if (Path.isBefore(endPath, targetPath)) {
      const newValue = produce(currentGroup.value, draft => {
        insertItems(towards, targetPath, draft, items)
        deleteItems(draft, startPath, endPath)
        if (towards === 'inner') {
          dragInnerMakeNewGroup({
            targetValue: targetValue
          })
        }
      })
      await ObjectStore('group').updateOne({ id: currentGroup.id, value: newValue })
    }
    if (Path.isAfter(startPath, targetPath)) {
      const newValue = produce(currentGroup.value, draft => {
        deleteItems(draft, startPath, endPath)
        insertItems(towards, targetPath, draft, items)
        if (towards === 'inner') {
          dragInnerMakeNewGroup({
            targetValue: targetValue
          })
        }
      })
      console.log(newValue)
      await ObjectStore('group').updateOne({ id: currentGroup.id, value: newValue })
    }
  }
}

export default reorderDragItems
