import { IGroupInstance, MetaGroupChild } from '~/typings'
import { Path } from 'slate'
import { GroupStore, MetaStore } from '@/stores'
/**
 * 在树中移动多个元素
 * 1. 首先删除要移动的元素
 */
const reorderDragItems = async (opts: {
  items: MetaGroupChild[]
  instance: IGroupInstance
  targetValue: MetaGroupChild
  towards: 'top' | 'bottom' | 'inner'
  insert?: boolean
}) => {
  const { towards, items, instance, targetValue } = opts
  const getPath = instance.pathOps?.getPathById
  if (getPath) {
    const targetPath = getPath(targetValue.rowId)
    if (!targetPath) return
    const targetPathRef = instance.pathOps?.pathRef(targetPath)
    if (!opts.insert) {
      items.sort((b, a) => (Path.isAfter(getPath(b.rowId)!, getPath(a.rowId)!) ? 1 : -1))
      const endPath = getPath(items[items.length - 1]?.rowId)
      const startPath = getPath(items[0]?.rowId)
      if (!endPath?.length || !startPath?.length) return
      const itemsWithPathref = items.map(i => ({ ...i, pathRef: instance.pathOps?.pathRef(getPath(i.rowId)) }))
      itemsWithPathref.forEach(i => {
        const path = i.pathRef?.unref()
        path && instance.valueOps?.removeByPath(path)
      })
    }
    const nowTargetPath = targetPathRef?.unref()
    if (!nowTargetPath) return
    if (targetValue.type === 'metaObject' && towards === 'inner') {
      const meta = await MetaStore.getMetaObjectById(targetValue.id)
      if (meta?.type === 'group' && meta.objectId) {
        GroupStore.insertItemsIntoGroup(items, meta.objectId)
        return
      }
    }
    instance.valueOps?.insertValueByPath(
      items,
      towards === 'top'
        ? nowTargetPath
        : towards === 'inner'
        ? [...nowTargetPath, targetValue.children?.length || 0]
        : Path.next(nowTargetPath)
    )
  }
}

export default reorderDragItems
