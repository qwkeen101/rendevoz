import { Rendevoz } from '@/core/rendevoz'
import { BuiltInDraggableElement, MetaGroupChild } from '~/typings'
import { Node, Path } from 'slate'
import { Draft } from 'immer'

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
  items: MetaGroupChild[]
) => {
  const targetParent = Node.get({ children: value }, Path.parent(targetPath)) as MetaGroupChild | undefined
  const target = Node.get({ children: value }, targetPath) as MetaGroupChild | undefined
  console.log(items, target, targetPath, targetParent)
  if (targetParent && target) {
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
