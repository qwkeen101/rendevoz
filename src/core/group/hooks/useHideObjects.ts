import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/group/hooks/useGroupState'
import { useEffect } from 'react'
import { MetaStore } from '@/stores'
import Node from '@/core/group/utils/node'
import { useSetAtom } from 'jotai'

export default () => {
  const hideObjects = useSelectAtomValue(GroupStateAtom, s => s.data?.hideObjectsInside)
  const hideGroups = useSelectAtomValue(GroupStateAtom, s => s.data?.hideGroupsInside)
  const values = useSelectAtomValue(GroupStateAtom, s => s.data?.values)
  const setGroupState = useSetAtom(GroupStateAtom)
  useEffect(() => {
    const map = MetaStore.getMetaObjectsMap()
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
            unhidden.push(m.id)
          } else {
            if (m.type === 'group' && hideGroups !== true) {
              hiddenGroups.push(m.id)
            }
          }
        }
      })
      hiddenGroups.forEach(id => MetaStore.updateMetaObject({ id: id, hidden: false }, true))
      unhidden.forEach(id => MetaStore.updateMetaObject({ id: id, hidden: true }, true))
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
      hidden.forEach(id => MetaStore.updateMetaObject({ id: id, hidden: false }, true))
    }
    setGroupState(s => ({ ...s, visibleTypes: Array.from(typesSet.values()) }))
  }, [values, hideObjects, hideGroups])
}
