import { IGroupInstance, MetaGroupChild } from '~/typings'
import { assignProperties } from '@/utils'
import { Group } from '@/core/group/hooks/weakmaps'
import Node from '@/core/group/utils/node'
import { ObjectStore } from '@/stores'
import produce from 'immer'
import { Path } from 'slate'
import Id from '@/utils/id'
import { useRef, useState } from 'react'

type GroupUpdateEvent =
  | {
      type: 'update'
      value: Partial<MetaGroupChild>
      path: Path
    }
  | {
      type: 'add'
      value: Partial<MetaGroupChild>
      path: Path
    }
  | {
      type: 'remove'
      path: Path
    }
const TypeToSlateType = {
  add: 'insert_node',
  remove: 'remove_node',
  update: 'set_node'
}
type RootNode = {
  children: MetaGroupChild[]
}
const useAssignValueOps = (instance: IGroupInstance, value: MetaGroupChild[], groupId: number) => {
  const [updateQueues] = useState<GroupUpdateEvent[]>([])
  const flushed = useRef(false)
  const handleQueues = () => {
    if (!flushed.current) {
      flushed.current = true
      Promise.resolve().then(() => {
        flushed.current = false
        console.log(structuredClone(updateQueues))
        const nextValue = produce(value, draft => {
          const rootNode = {
            children: draft
          }
          while (updateQueues.length) {
            const firstEvent = updateQueues[0]
            if (firstEvent.path?.length) {
              switch (firstEvent.type) {
                case 'add':
                  handleAdd(firstEvent.value, firstEvent.path, rootNode)
                  break
                case 'update':
                  handleUpdate(firstEvent.value, firstEvent.path, rootNode)
                  break
                case 'remove':
                  handleRemove(firstEvent.path, rootNode)
                  break
              }
            }
            updateQueues.shift()
            updateQueues.forEach(e => {
              if (!e.path || !firstEvent.path) return
              e.path = Path.transform(e.path, {
                type: TypeToSlateType[firstEvent.type],
                path: firstEvent.path
              })
            })
          }
        })
        ObjectStore('group').updateOne({ id: groupId, value: nextValue })
      })
    }
  }
  const handleAdd = (v: Partial<MetaGroupChild>, path: Path, draft: RootNode) => {
    const parent = Node.get(draft, Path.parent(path))
    if (parent) {
      const index = path[path.length - 1]
      parent.children.splice(index, 0, v)
    }
  }
  const handleUpdate = (v: Partial<MetaGroupChild>, path: Path, draft: RootNode) => {
    const parent = Node.get(draft, Path.parent(path))
    if (parent) {
      const index = path[path.length - 1]
      parent.children[index] = { ...parent.children[index], ...v }
    }
  }
  const handleRemove = (path: Path, draft: RootNode) => {
    const parent = Node.get(draft, Path.parent(path))
    if (parent) {
      const index = path[path.length - 1]
      parent.children.splice(index, 1)
    }
  }
  assignProperties(instance, {
    valueOps: {
      getValueById: id => Group.ID_TO_VALUE_MAP.get(instance)?.get(id),
      getValueByPath: path => {
        return Node.get({ children: value }, path)
      },
      insertValueByPath: (v, path) => {
        if (!v.type) return
        if (!v.rowId) {
          v.rowId = Id.getId()
        }
        const finalPath = path ? Path.next(path) : [value.length]
        updateQueues.push({
          type: 'add',
          value: v,
          path: finalPath
        })
        handleQueues()
      },
      removeByPath: path => {
        updateQueues.push({
          type: 'remove',
          path
        })
        handleQueues()
      },
      updateValueByPath: (v, path) => {
        updateQueues.push({
          type: 'update',
          value: v,
          path
        })
        handleQueues()
      },
      getVisibleValues: () => {
        return Node.elements({ children: value }, { match: n => !n.toggled })
      }
    }
  })
}

export default useAssignValueOps
