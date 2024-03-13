import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { t } from 'i18next'
import produce from 'immer'
import Id from '@/utils/id'
import assignViewTableOps from '@/core/components/group/hooks/ops/view/table'
import { DEFAULT_GROUP_PROPERTIES } from '@/core/components/group/consts/defaultProperties'
import { useStore } from 'jotai'
import assignGalleryOps from '@/core/components/group/hooks/ops/view/gallery'

const VIEW_INVISIBLE_PROPS = {
  gallery: [2, 5, 7, 8, 9, 11, 12, 13],
  kanban: [2, 5, 7, 8, 9, 11, 12, 13],
  list: [2, 3, 5, 7, 8, 14, 9, 10, 11, 12, 13]
}
export default function assignViewOps(instance: IGroupInstance) {
  const store = useStore()
  assignProperties(instance, {
    viewOps: {
      addNewView: async viewType => {
        const groupState = store.get(GroupStateAtom)
        if (!groupState) return
        const newViewId = Id.getId()
        if (viewType === 'gallery') {
          await instance.updateGroupData?.(s => ({
            ...s,
            lastViewId: newViewId,
            views: [
              ...s.views,
              {
                type: 'gallery',
                unToggledIds: [],
                id: newViewId,
                name: t('general.Gallery'),
                icon: 'park-all-application',
                options: {
                  cardSize: 'medium',
                  wrapColumns: false,
                  fitImage: false,
                  properties: Object.fromEntries(
                    [...DEFAULT_GROUP_PROPERTIES, ...(groupState.state?.extraProperties || [])].map((i, idx) => [
                      i.id,
                      {
                        width: i.width ?? 150,
                        visible: i.visible,
                        order: idx
                      }
                    ])
                  )
                },
                valueIndex: []
              }
            ]
          }))
        }
        if (viewType === 'table') {
          instance.updateGroupData?.(s => ({
            ...s,
            lastViewId: newViewId,
            views: [
              ...s.views,
              {
                type: 'table',
                unToggledIds: [],
                id: newViewId,
                icon: 'park-table-file',
                name: t('general.Table'),
                options: {
                  cardSize: 'medium',
                  wrapColumns: false,
                  properties: Object.fromEntries(
                    [...DEFAULT_GROUP_PROPERTIES, ...(groupState.state?.extraProperties || [])].map((i, idx) => [
                      i.id,
                      {
                        width: i.width ?? 150,
                        visible: i.visible,
                        order: idx
                      }
                    ])
                  )
                },
                valueIndex: []
              }
            ]
          }))
        }
        if (viewType === 'list') {
          instance.updateGroupData?.(s => ({
            ...s,
            lastViewId: newViewId,
            views: [
              ...s.views,
              {
                type: 'list',
                unToggledIds: [],
                id: newViewId,
                icon: 'custom-list',
                name: t('general.List'),
                options: {
                  wrapColumns: false,
                  properties: Object.fromEntries(
                    [...DEFAULT_GROUP_PROPERTIES, ...(groupState.state?.extraProperties || [])].map((i, idx) => [
                      i.id,
                      {
                        width: i.width ?? 150,
                        visible: i.visible,
                        order: idx
                      }
                    ])
                  )
                },
                valueIndex: []
              }
            ]
          }))
        }
        if (viewType === 'kanban') {
          instance.updateGroupData?.(s => ({
            ...s,
            lastViewId: newViewId,
            views: [
              ...s.views,
              {
                type: 'kanban',
                unToggledIds: [],
                id: newViewId,
                icon: 'custom-kanban',
                name: t('general.Kanban'),
                options: {
                  wrapColumns: false,
                  properties: Object.fromEntries(
                    [...DEFAULT_GROUP_PROPERTIES, ...(groupState.state?.extraProperties || [])].map((i, idx) => [
                      i.id,
                      {
                        width: i.width ?? 150,
                        visible: i.visible,
                        order: idx
                      }
                    ])
                  )
                },
                valueIndex: [],
                group: {
                  fieldType: 'string',
                  propertyGroupType: 'basic',
                  propertyId: 2,
                  textBy: 'alphabetical',
                  sort: 'manual'
                }
              }
            ]
          }))
        }
      },
      updateProperty: async (id, newProp) => {
        const currentView = instance.getCurrentView?.()
        if (!currentView) return
        instance.updateGroupData?.(w =>
          produce(w, draft => {
            draft.properties = draft.properties?.map(i => (i.id === id ? { ...i, ...newProp } : i))
            draft.views = draft.views.map(v => {
              if (v.id === currentView.id) {
                const origin = v.options.properties?.[id]
                if (origin) {
                  v.options.properties![id] = { ...origin, ...newProp }
                }
              }
              return v
            })
          })
        )
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
      getInvisibleViewPropertyIds: () => {
        const currentViewType = instance.getCurrentView?.()?.type
        const invisiblePropIds = new Set([
          ...(store.get(GroupStateAtom).state?.invisibleProperties ?? []),
          ...(currentViewType ? VIEW_INVISIBLE_PROPS[currentViewType] ?? [] : [])
        ])
        return invisiblePropIds
      },
      getVisibleProperties: () => {
        const invisiblePropIds = instance.viewOps?.getInvisibleViewPropertyIds()
        const currentView = instance.getCurrentView?.()?.options.properties
        const allProperties = instance.getGroupData?.()?.properties
        const onlyShowCustom = instance.getGroupData?.()?.onlyShowCustomProperties

        if (!currentView || !allProperties) return
        return allProperties.filter(i => {
          if (invisiblePropIds?.has(i.id)) return false
          if (onlyShowCustom) {
            if (i.name === 'name' || i.name === 'type' || i.type === 'custom' || i.name === 'tags') {
              return currentView[i.id]?.visible ?? i.visible ?? false
            }
            return false
          }
          return currentView[i.id]?.visible ?? i.visible
        })
      },
      useViewProperties: () => {
        const props = useSelectAtomValue(GroupStateAtom, s => s.currentViewProperties)
        return props
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
            if (draft.properties?.some(i => i.id === newProp.id)) return
            draft.properties?.push({
              id: newProp.id,
              name: newProp.name,
              visible: true,
              type: 'custom',
              editable: true,
              icon: newProp.icon,
              propType: newProp.propType
            })
            console.log(newProp)
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
  assignGalleryOps(instance)
}
