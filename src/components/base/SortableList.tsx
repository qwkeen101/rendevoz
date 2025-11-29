import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToFirstScrollableAncestor, restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { ReactElement } from 'react'
import { CSS } from '@dnd-kit/utilities'
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'

export default function <T>({
  items,
  onChange,
  renderItem
}: {
  onChange: (values: T[]) => void
  items: T[]
  renderItem: (i: T, listeners?: SyntheticListenerMap) => ReactElement
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToFirstScrollableAncestor, restrictToVerticalAxis, restrictToParentElement]}
      collisionDetection={closestCenter}
      onDragEnd={event => {
        const { active, over } = event
        if (active && over && active.id !== over.id) {
          const oldIndex = items.findIndex(i => (i && typeof i === 'object' && 'id' in i ? i.id : i) === active.id)
          const newIndex = items.findIndex(i => (i && typeof i === 'object' && 'id' in i ? i.id : i) === over.id)
          onChange?.(arrayMove(items, oldIndex, newIndex))
        }
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(i => (
          <SortableItem item={i} key={i && typeof i === 'object' && 'id' in i ? i.id : i} renderItem={renderItem} />
        ))}
      </SortableContext>
    </DndContext>
  )
}

function SortableItem<T>({ item, renderItem }: { item: T; renderItem: (i: T, listeners?: SyntheticListenerMap) => ReactElement }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: item && typeof item === 'object' && 'id' in item ? item.id : item
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 10 : undefined
  }
  return (
    <div {...attributes} ref={setNodeRef} style={style}>
      {renderItem(item, listeners)}
    </div>
  )
}
