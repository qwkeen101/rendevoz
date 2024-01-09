import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useMemo } from 'react'
import produce from 'immer'
import Id from '@/utils/id'
import assignViewTableOps from '@/core/components/group/hooks/ops/view/table'

export default function assignViewOps(instance: IGroupInstance) {
  assignProperties(instance, {
    viewOps: {
      updateProperty: async (id, newProp) => {
        instance.updateCurrentView?.(w => {
          return produce(w, draft => {
            const origin = draft.options.properties?.[id]
            if (origin) {
              draft.options.properties![id] = { ...origin, ...newProp }
            }
          })
        })
      },
      deleteCustomProperty: async (propertyName, deleteMetaProp = true) => {
        await instance.updateGroupData?.(data => {
          return produce(data, draft => {
            draft.properties = draft.properties?.filter(i => i.id !== propertyName)
            draft.views.forEach(v => {
              delete v.options.properties?.[propertyName]
            })
          })
        })
        if (deleteMetaProp) {
          await MetaStore.deleteProperty(propertyName)
        }
        return
      },
      getVisibleProperties: () => {
        const currentView = instance.getCurrentView?.()?.options.properties
        const allProperties = instance.getGroupData?.()?.properties
        const onlyShowCustom = instance.getGroupData?.()?.onlyShowCustomProperties
        if (!currentView || !allProperties) return
        return allProperties.filter(i => {
          if (onlyShowCustom) {
            if (i.name === 'name' || i.name === 'type' || i.type === 'custom') {
              return currentView[i.id]?.visible ?? false
            }
            return false
          }
          return currentView[i.id]?.visible
        })
      },
      useViewProperties: () => {
        const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.properties)
        const allProperties = useSelectAtomValue(GroupStateAtom, s => s.data?.properties)
        const onlyShowCustom = useSelectAtomValue(GroupStateAtom, s => s.data?.onlyShowCustomProperties)
        const sortedProps = useMemo(() => {
          if (!currentView || !allProperties) return
          const visibleProps = new Set(instance.viewOps?.getVisibleProperties()?.map(i => i.id))
          return allProperties
            .slice()
            .map(i => ({ ...i, width: currentView[i.id]?.width ?? 150, visible: visibleProps.has(i.id) }))
            .sort((a, b) => currentView[a.id]?.order - currentView[b.id]?.order)
        }, [currentView, allProperties, onlyShowCustom])
        return sortedProps
      },
      addNewProperty: async prop => {
        const currentView = instance.getCurrentView?.()
        const data = instance.getGroupData?.()
        if (!currentView || !data) return
        const nextName = MetaStore.getNewPropName(prop.name)
        const allMetas = instance.valueOps?.getAllMetasInGroup()
        const newProp = prop.id
          ? MetaStore.getPropDetails(prop.id)
          : await MetaStore.addNewProp({ name: nextName, icon: prop.icon, propType: prop.propType, id: prop.id })
        if (!newProp) return
        allMetas?.forEach(i => {
          if (!i['properties']?.[newProp.id]) {
            MetaStore.updateProperty(i.id, newProp.id, {
              value: undefined
            })
          }
        })
        instance.updateGroupData?.(w => {
          return produce(w, draft => {
            draft.properties?.push({
              id: newProp.id,
              name: newProp.name,
              visible: true,
              type: 'custom',
              editable: true,
              icon: newProp.icon,
              propType: newProp.propType
            })
            draft.views.forEach(v => {
              v.options.properties = {
                ...v.options.properties,
                [newProp.id]: {
                  visible: true,
                  width: 150,
                  order: Object.keys(v.options.properties || {}).length
                }
              }
            })
          })
        })
      },
      changePropertyName: async (id, newName) => {
        const currentView = instance.getCurrentView?.()
        const data = instance.getGroupData?.()
        if (currentView && data) {
          const prop = data.properties?.find(i => i.id === id)
          if (!prop || prop.type !== 'custom') return
          await MetaStore.changePropertyName(id, newName)
        }
      }
    }
  })
  assignViewTableOps(instance)
}
