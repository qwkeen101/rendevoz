import { IGroupInstance, MetaGroupChild } from '~/typings'
import { ObjectStore } from '@/stores'
import { Path } from 'slate'
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
    const endPath = getPath(items[items.length - 1]?.rowId)
    const startPath = getPath(items[0]?.rowId)
    if (!endPath?.length || !startPath?.length) return
    const targetPathRef = instance.pathOps?.pathRef(targetPath)
    const itemsWithPathref = items.map(i => ({ ...i, pathRef: instance.pathOps?.pathRef(getPath(i.rowId)) }))
    itemsWithPathref.forEach(i => {
      const path = i.pathRef?.unref()
      path && instance.valueOps?.removeByPath(path)
    })
    const nowTargetPath = targetPathRef?.unref()
    if (!nowTargetPath) return
    instance.valueOps?.insertValueByPath(
      items,
      towards === 'top'
        ? nowTargetPath
        : towards === 'inner'
        ? [...nowTargetPath, targetValue.children?.length || 0]
        : Path.next(nowTargetPath)
    )
    if (towards === 'inner') {
      dragInnerMakeNewGroup({
        targetValue: targetValue,
        items
      })
    }
  }
}

export default reorderDragItems
