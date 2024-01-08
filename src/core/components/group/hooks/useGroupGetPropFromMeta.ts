import { IGroupInstance, IMetaProp } from '~/typings'
import { useDebounceEffect, useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useEffect } from 'react'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { useSetAtom } from 'jotai'

export default (instance: IGroupInstance) => {
  const groupData = useSelectAtomValue(GroupStateAtom, s => s.data)
  const metas = MetaStore.useMetaObjectsMap()
  const setGroupState = useSetAtom(GroupStateAtom)
  useDebounceEffect(
    () => {
      const inGroupMetas = instance.valueOps?.getAllMetasInGroup()
      const availableProps = globalStore.get(ObjectStore('metaProp').objectMapAtom)
      const propIds = new Set<number>()
      inGroupMetas?.forEach(m => {
        if (m.properties) {
          Object.keys(m.properties).forEach(i => {
            const id = Number(i)
            if (!propIds.has(id) && availableProps.has(id)) {
              propIds.add(id)
            }
          })
        }
      })
      const currentGroupCustomProps = groupData?.properties?.filter(i => i.type === 'custom') ?? []
      const availableNewProps: IMetaProp[] = []
      const currentGroupPropIds = new Set(currentGroupCustomProps.map(i => i.id))
      propIds.forEach(id => {
        if (!currentGroupPropIds.has(id)) {
          const details = MetaStore.getPropDetails(id)
          details && availableNewProps.push(details)
        }
      })
      setGroupState(s => ({ ...s, availableNewProps: availableNewProps }))
    },
    [metas],
    { wait: 500 }
  )
}
