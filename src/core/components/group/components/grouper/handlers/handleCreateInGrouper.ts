import { IGroupInstance } from '~/typings'
import { MetaStore } from '@/api/stores'
import { StringGroupRule } from '~/typings/components/group/property-group'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { EMPTY_GROUPER_NAME } from '@/core/components/group/hooks/grouper/useBuildGrouper'
import updateDateProp from '@/core/components/group/hooks/grouper/calculator/updateDateProp'
import { DEFAULT_GROUP_PROPERTY_OBJ } from '@/core/components/group/consts/defaultProperties'

export default (metaIds: number | number[], grouperId: number, instance: InnerGroupInstance) => {
  const ids = Array.isArray(metaIds) ? metaIds : [metaIds]
  const currentGrouper = instance.getGroupState?.().groups?.find(i => i.id === grouperId)
  const currentGroupRule = instance.getCurrentView?.()?.group
  const metaMap = MetaStore.getMetaObjectsMap()
  const updateProp = (value: any, updateArr?: boolean) => {
    if (!currentGroupRule) return
    if (currentGroupRule.propertyGroupType === 'custom') {
      ids.forEach(id => {
        const meta = metaMap.get(id)
        if (meta) {
          if (updateArr && value !== undefined) {
            const currArr = meta.properties?.[currentGroupRule.propertyId]?.value as number[] | undefined
            if (currArr?.includes(value)) return
            MetaStore.updateProperty(id, currentGroupRule.propertyId, {
              value: [...(currArr || []), value]
            })
          } else {
            if (meta.properties?.[currentGroupRule.propertyId]?.value !== value) {
              MetaStore.updateProperty(id, currentGroupRule.propertyId, {
                value
              })
            }
          }
        }
      })
    } else {
      const prop = DEFAULT_GROUP_PROPERTY_OBJ[currentGroupRule.propertyId]
      ids.forEach(id => {
        const meta = metaMap.get(id)
        if (meta) {
          if (updateArr && value !== undefined) {
            const currArr = meta[prop.name] as number[] | undefined
            if (!currArr?.includes(value)) {
              MetaStore.updateMetaObject({ id: meta.id, [prop.name]: [...(currArr || []), value] })
            }
          } else {
            if (meta[prop.name] !== value) {
              MetaStore.updateMetaObject({ id: meta.id, [prop.name]: value })
            }
          }
        }
      })
    }
  }
  if (currentGroupRule && currentGrouper) {
    let prop = undefined
    if (currentGroupRule.propertyGroupType === 'custom') {
      prop = MetaStore.getPropDetails(currentGroupRule.propertyId)
    }
    if (currentGroupRule.propertyGroupType === 'basic') {
      prop = DEFAULT_GROUP_PROPERTY_OBJ[currentGroupRule.propertyId]
    }
    if (prop && 'propType' in prop) {
      switch (prop.propType) {
        case 'string':
          {
            const groupRule = currentGroupRule as StringGroupRule
            const textBy = groupRule.textBy
            if (textBy === 'exact') {
              updateProp(currentGrouper.name === EMPTY_GROUPER_NAME ? '' : currentGrouper.name)
            }
            if (textBy === 'alphabetical') {
              updateProp(currentGrouper.name === EMPTY_GROUPER_NAME ? '' : currentGrouper.name[0])
            }
          }
          return
        case 'singleSelect':
          {
            const value = currentGrouper.name === EMPTY_GROUPER_NAME ? undefined : Number(currentGrouper.name)
            updateProp(value)
          }
          return
        case 'checkbox': {
          const value = currentGrouper.name === EMPTY_GROUPER_NAME ? false : currentGrouper.name === 'true' ? true : false
          updateProp(value)
          return
        }
        case 'date': {
          if (currentGrouper.name === EMPTY_GROUPER_NAME) {
            updateProp(undefined)
          }
          if (currentGroupRule.fieldType === 'date') {
            const value = updateDateProp(currentGroupRule, currentGrouper.name)
            if (value) {
              updateProp(value)
            }
          }
          return
        }
        case 'number': {
          if (currentGrouper.name === EMPTY_GROUPER_NAME) {
            updateProp(undefined)
          }
          const num = Number(currentGrouper.name)
          if (!Number.isNaN(num)) {
            updateProp(num)
          }
          return
        }
        case 'multiSelect':
          {
            if (currentGrouper.name === EMPTY_GROUPER_NAME) {
              updateProp(undefined)
            }
            const valueId = Number(currentGrouper.name)
            if (Number.isInteger(valueId)) {
              updateProp(valueId, true)
            }
          }
          return
      }
    }
  }
}
