import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useEffect } from 'react'
import { MetaStore } from '@/api/stores'
import Node from '@/core/components/group/utils/node'
import { useSetAtom } from 'jotai'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

export default (groupId?: number) => {
  const hideObjects = useSelectAtomValue(GroupStateAtom, s => s.data?.hideObjectsInside)
  const hideGroups = useSelectAtomValue(GroupStateAtom, s => s.data?.hideGroupsInside)
  const values = useSelectAtomValue(GroupStateAtom, s => s.data?.values)
  const setGroupState = useSetAtom(GroupStateAtom)
  const instance = useGroupInstance()
  useEffect(() => {
    const map = MetaStore.getMetaObjectsMap()
    const disableHideFunction = instance.getGroupState?.().state?.canHideObjectsInside === false

    if (!values) return
    const typesSet = new Set<string>()
    const elements = Node.elements({ children: values })
    if (hideObjects) {
      const unhidden: number[] = []
      const hiddenGroups: number[] = []
      elements.forEach(e => {
        const n = e[0]
        if (n.type === 'metaObject' && map.has(n.id)) {
          const m = map.get(n.id)!
          typesSet.add(m.type)
          if (!m.hidden) {
            if (m.type === 'group' && hideGroups !== true) {
              return
            }
            // can not hide self
            if (m.objectId === groupId) return
            unhidden.push(m.id)
          } else {
            if (m.type === 'group' && hideGroups !== true) {
              hiddenGroups.push(m.id)
            }
            if (m.objectId === groupId && m.hidden) {
              hiddenGroups.push(m.id)
            }
          }
        }
      })
      if (!disableHideFunction) {
        hiddenGroups.forEach(id => MetaStore.updateMetaObject({ id: id, hidden: false }))
        unhidden.forEach(id => MetaStore.updateMetaObject({ id: id, hidden: true }))
      }
    } else {
      const hidden: number[] = []
      elements.forEach(e => {
        const n = e[0]
        if (n.type === 'metaObject' && map.has(n.id)) {
          const m = map.get(n.id)!
          typesSet.add(m.type)
          if (m.hidden) {
            hidden.push(m.id)
          }
        }
      })
      if (!disableHideFunction) {
        hidden.forEach(id => MetaStore.updateMetaObject({ id: id, hidden: false }))
      }
    }
    setGroupState(s => ({ ...s, visibleTypes: Array.from(typesSet.values()) }))
  }, [values, hideObjects, hideGroups])
}
