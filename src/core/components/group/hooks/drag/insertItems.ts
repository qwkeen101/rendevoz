import { Rendevoz } from '@/core/rendevoz'
import { BuiltInDraggableElement, MetaGroupChild } from '~/typings'
import { Node, Path } from 'slate'
import { Draft } from 'immer'
import handleDragInGrouper from '@/core/components/group/components/grouper/handlers/handleDragInGrouper'
import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const insertDragItemIntoGroup = (groupId: number) => {
  const dragItem = Rendevoz.Actions.State.Drag.getDraggingDetails() as BuiltInDraggableElement | undefined
  if (dragItem) {
    if (dragItem.type === 'metaElement') {
    }
    if (dragItem.type === 'groupItem') {
    }
  }
}

export const insertItems = (
  towards: 'top' | 'bottom' | 'inner',
  targetPath: Path,
  value: Draft<MetaGroupChild[]>,
  items: MetaGroupChild[],
  instance: InnerGroupInstance
) => {
  const targetParent = Node.get({ children: value }, Path.parent(targetPath)) as MetaGroupChild | undefined
  const target = Node.get({ children: value }, targetPath) as MetaGroupChild | undefined
  console.log(items, target, targetPath, targetParent)
  if (targetParent && target) {
    handleDragInGrouper(
      items.map(i => i.id),
      target,
      instance
    )
    const targetIndex = targetPath[targetPath.length - 1]
    if (towards === 'top') {
      targetParent.children.splice(targetIndex, 0, ...items)
    }
    if (towards === 'bottom') {
      targetParent.children.splice(targetIndex + 1, 0, ...items)
    }
    if (towards === 'inner') {
      target.children = [...(target.children || []), ...items]
    }
  }
}
export default insertDragItemIntoGroup
