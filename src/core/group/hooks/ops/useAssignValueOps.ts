import { IGroupInstance, MetaGroupChild } from '~/typings'
import { assignProperties } from '@/utils'
import { Group } from '@/core/group/hooks/weakmaps'
import Node from '@/core/group/utils/node'
import { ObjectStore } from '@/stores'
import produce from 'immer'
import { Path, PathRef } from 'slate'
import Id from '@/utils/id'
import { useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai/index'
import { GroupStateAtom } from '@/core/group/hooks/useGroupState'

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
  const flushed = useRef(false)
  const applyEvent = (e: GroupUpdateEvent) => {
    const op = {
      type: TypeToSlateType[e.type],
      path: e.path
    }
    for (const ref of instance.values.pathRefs) {
      PathRef.transform(ref, op)
    }
    const nextValue = produce(instance.values.currentValue, draft => {
      const rootNode = {
        children: draft
      }
      switch (e.type) {
        case 'add':
          handleAdd(e.value, e.path, rootNode)
          break
        case 'update':
          handleUpdate(e.value, e.path, rootNode)
          break
        case 'remove':
          handleRemove(e.path, rootNode)
          break
      }
    })
    instance.values.currentValue = nextValue
    if (!flushed.current) {
      flushed.current = true
      Promise.resolve().then(() => {
        flushed.current = false
        ObjectStore('group').updateOne({ id: groupId, value: instance.values.currentValue })
      })
    }
  }
  const handleAdd = (v: Partial<MetaGroupChild>, path: Path, draft: RootNode) => {
    const parent = Node.get(draft, Path.parent(path))
    if (parent) {
      const index = path[path.length - 1]
      if (!parent.children) {
        parent.children = [v]
      } else {
        parent.children.splice(index, 0, v)
      }
    }
  }
  const handleUpdate = (v: Partial<MetaGroupChild>, path: Path, draft: RootNode) => {
    const parent = Node.get(draft, Path.parent(path))
    if (parent) {
      const index = path[path.length - 1]
      if (!parent.children?.[index]) return
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
  const setGroupState = useSetAtom(GroupStateAtom)
  const buildIndex = () => {
    let unToggledCount = 0
    const id_to_path_map = Group.ID_TO_PATH_MAP.get(instance)
    const id_to_value_map = Group.ID_TO_VALUE_MAP.get(instance)
    if (!id_to_path_map || !id_to_value_map) return
    id_to_path_map.clear()
    const loop = (v: MetaGroupChild, index: number, curr: Path, parentToggled: boolean) => {
      id_to_value_map.set(v.rowId, v)
      const thisPath = [...curr, index]
      id_to_path_map.set(v.rowId, thisPath)
      if (!parentToggled) {
        unToggledCount += 1
      }
      if (v.children?.length) {
        v.children.forEach((value, index1) => loop(value, index1, thisPath, !!v.toggled))
      }
    }
    value.forEach((value, index) => {
      loop(value, index, [], false)
    })
    setGroupState(s => (s.unToggledValueCount !== unToggledCount ? { ...s, unToggledValueCount: unToggledCount } : s))
  }
  useEffect(() => {
    instance.values.currentValue = value
  }, [value])
  assignProperties(instance, {
    valueOps: {
      getValueById: id => Group.ID_TO_VALUE_MAP.get(instance)?.get(id),
      getValueByPath: path => {
        return Node.get({ children: value }, path)
      },
      buildIndex,
      insertValueByPath: (v, path) => {
        const finalPath = path || [value.length]
        if (Array.isArray(v)) {
          const parentPath = Path.parent(finalPath)
          let index = finalPath[finalPath.length - 1]
          const filtered = v
            .filter(i => i.type)
            .map(o => {
              if (!o.rowId) {
                o.rowId = Id.getId()
              }
              return o
            })
          filtered.forEach(v => {
            const path = parentPath.concat(index)
            index++
            applyEvent({
              type: 'add',
              value: v,
              path
            })
          })
        } else {
          if (!v.type) return
          if (!v.rowId) {
            v.rowId = Id.getId()
          }
          applyEvent({
            type: 'add',
            value: v,
            path: finalPath
          })
        }
      },
      removeByPath: path => {
        applyEvent({
          type: 'remove',
          path
        })
      },
      updateValueByPath: (v, path) => {
        applyEvent({
          type: 'update',
          value: v,
          path
        })
      },
      getVisibleValues: () => {
        return Node.elements({ children: value }, { match: n => !n.toggled })
      }
    }
  })
}

export default useAssignValueOps
