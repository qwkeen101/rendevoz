import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useEffect } from 'react'
import { MetaStore } from '@/api/stores'
import Node from '@/core/components/group/utils/node'
import { useSetAtom } from 'jotai'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { isEqual } from 'lodash'
import queueTurnUnhidden from '@/api/stores/meta/queueTurnUnhidden'

const useHideObjects = (groupId?: number) => {
  const { hideObjects, turnUnhidden, values } = useSelectAtomValue(
    GroupStateAtom,
    s => ({
      hideObjects: s.data?.hideObjectsInside,
      turnUnhidden: s.state?.canTurnHiddenIntoUnhidden,
      values: s.data?.values
    }),
    { compare: isEqual }
  )
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
      elements.forEach(e => {
        const n = e[0]
        if (n.type === 'metaObject') {
          const m = map.get(n.id)
          if (!m) return
          typesSet.add(m.type)
          if (!m.hidden) {
            // can not hide self
            if (m.objectId === groupId) return
            unhidden.push(m.id)
          }
        }
      })
      if (!disableHideFunction) {
        unhidden.forEach(id => MetaStore.updateMetaObject({ id: id, hidden: true }))
      }
    } else {
      const hidden: number[] = []
      elements.forEach(e => {
        const n = e[0]
        if (n.type === 'metaObject') {
          const m = map.get(n.id)
          if (!m) return
          typesSet.add(m.type)
          if (m.hidden) {
            hidden.push(m.id)
          }
        }
      })
      if (!disableHideFunction && turnUnhidden !== false) {
        if (hidden.length) {
          hidden.forEach(id =>
            queueTurnUnhidden({
              metaId: id,
              groupId: groupId,
              type: 'object'
            })
          )
        }
      }
    }
    setGroupState(s => ({ ...s, visibleTypes: Array.from(typesSet.values()) }))
  }, [values, hideObjects])
}

export default useHideObjects
