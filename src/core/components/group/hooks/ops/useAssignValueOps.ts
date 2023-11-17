import { IGroupInstance, MetaGroupChild } from '~/typings'
import { assignProperties } from '@/utils'
import { Group } from '@/core/components/group/hooks/weakmaps'
import Node from '@/core/components/group/utils/node'
import { MetaStore, ObjectStore } from '@/api/stores'
import produce from 'immer'
import { Path, PathRef } from 'slate'
import Id from '@/utils/id'
import { useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai/index'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useSelectAtomValue } from '@/hooks'

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
const useAssignValueOps = (instance: IGroupInstance) => {
  const value = useSelectAtomValue(GroupStateAtom, s => s.data?.values)
  const filterValue = useSelectAtomValue(GroupStateAtom, s => s.filterValues)
  const displayValue = useSelectAtomValue(GroupStateAtom, s => s.viewValues)
  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView)
  const flushed = useRef(false)
  const unToggledSet = useSelectAtomValue(GroupStateAtom, s => s.unToggledIdSet)
  const hideObjects = useSelectAtomValue(GroupStateAtom, s => s.data?.hideObjectsInside)
  const flushUnhiddenMetas = useRef<number[]>([])
  useEffect(() => {
    instance.values.currentIndex = currentView?.valueIndex?.slice()
  }, [currentView?.valueIndex])
  useEffect(() => {
    if (displayValue) {
      instance.values.currentValue = displayValue.slice()
    }
  }, [displayValue])

  const applyEvent = (e: GroupUpdateEvent) => {
    instance.triggerChange?.()
    const op = {
      type: TypeToSlateType[e.type],
      path: e.path
    }
    for (const ref of instance.values.pathRefs) {
      PathRef.transform(ref, op)
    }
    if (instance.values.currentIndex && e.path.length === 1) {
      switch (e.type) {
        case 'add':
          instance.values.currentIndex = produce(instance.values.currentIndex, draft => {
            draft.splice(e.path[0], 0, e.value.rowId!)
          })
          break
        case 'remove':
          instance.values.currentIndex = produce(instance.values.currentIndex, draft => {
            draft.splice(e.path[0], 1)
          })
          break
      }
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
        // 100ms timeout to prevent history
        setTimeout(() => {
          flushUnhiddenMetas.current.forEach(id => {
            MetaStore.updateMetaObject({ id: id, hidden: false }, true)
          })
          flushUnhiddenMetas.current = []
        }, 100)

        const originalPlace: Record<number, number> = {}
        value?.forEach((i, idx) => {
          originalPlace[i.rowId] = idx
        })
        const copyed = instance.values.currentValue.slice()
        copyed.sort((b, a) => originalPlace[b.rowId] - originalPlace[a.rowId])

        instance
          .updateGroupData?.(s =>
            produce(s, draft => {
              draft.values = copyed
              console.log(instance.values.currentIndex)
              const v = draft.views.find(i => i.id === currentView?.id)
              if (v && instance.values.currentIndex) {
                v.valueIndex = instance.values.currentIndex
              }
            })
          )
          .then(() => {
            setGroupState(s => ({ ...s, currentView: { ...s.currentView, valueIndex: instance.values.currentIndex } }))
          })
      })
    }
  }

  const setGroupState = useSetAtom(GroupStateAtom)
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
      const item = parent.children[index]
      if (item.type === 'metaObject' && hideObjects) {
        flushUnhiddenMetas.current.push(item.id)
      }
      parent.children.splice(index, 1)
    }
  }

  assignProperties(instance, {
    valueOps: {
      getValueById: id => Group.ID_TO_VALUE_MAP.get(instance)?.get(id),
      handleToggle: (rowId, toggled) => {
        console.log(rowId, toggled)
        instance.updateCurrentView?.(s => ({
          ...s,
          unToggledIds: toggled ? s.unToggledIds.filter(i => i !== rowId) : Array.from(new Set([...(s.unToggledIds || []), rowId]).values())
        }))
      },
      getValueByPath: path => {
        return Node.get({ children: instance.values.currentValue }, path)
      },
      isParent: (maybeParent, child) => {
        const metaMap = MetaStore.getMetaObjectsMap()
        // first check by attachment
        if (maybeParent.type === 'metaObject') {
          const atts = metaMap.get(maybeParent.id)?.attachments || []
          if (child.type === 'metaObject' && atts.some(i => i.id === child.id)) {
            return true
          }
        }
        // second loop through children
        const loop = (value: { children?: MetaGroupChild[] }) => {
          if (!value.children?.length) return false
          if (value.children?.some(i => i.rowId === child.rowId)) {
            return true
          }
          return value.children.some(i => loop(i))
        }
        return loop(maybeParent)
      },
      insertValueByPath: (v, path) => {
        const finalPath = path || [displayValue.length]
        const values = Array.isArray(v) ? v : [v]
        // 检查是否节点变成自己的子节点，或者子节点的子节点是父节点
        if (values) {
          const parentPath = Path.parent(finalPath)
          let index = finalPath[finalPath.length - 1]
          const filtered = values
            .filter(i => i.type)
            .map(o => {
              if (!o.rowId) {
                o.rowId = Id.getId()
              }
              return o
            })
          let parentNode: MetaGroupChild | undefined = undefined
          if (finalPath.length !== 1) {
            parentNode = instance.valueOps?.getValueByPath(parentPath)
          }
          filtered.forEach(v => {
            if (parentNode) {
              // if child is parent's parent
              if (instance.valueOps?.isParent(v, parentNode)) {
                return
              }
              if (parentNode.type === 'metaObject' && v.type === 'metaObject' && parentNode.id === v.id) {
                return
              }
            }
            const path = parentPath.concat(index)
            index++
            applyEvent({
              type: 'add',
              value: v,
              path
            })
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
        return Node.elements(
          { children: filterValue || displayValue },
          { match: (n, path, parent) => (parent ? unToggledSet.has(parent.id) : true) }
        )
      },
      removeByPaths: paths => {
        const pathWithPathRef = paths.map(i => instance.pathOps?.pathRef(i))
        pathWithPathRef.forEach(ref => {
          const curr = ref?.unref()
          if (curr) {
            instance.valueOps?.removeByPath(curr)
          }
        })
      }
    }
  })
}

export default useAssignValueOps
