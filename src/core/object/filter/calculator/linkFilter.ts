import { LinkFilterRule, MetaObject } from '~/typings'
import { transformFilterGroupToFilterArray } from '@/core/object/filter/useBetterFilter'
import { MetaStore } from '@/api/stores'

const linkFilter = async (rule: LinkFilterRule): Promise<(o: MetaObject) => boolean> => {
  const { type, metaType, ruleType } = rule
  const linkIndex = MetaStore.getIndexedMetaLinks()
  if (!linkIndex) return () => false
  const { sourceIdToTargetIdsMap, targetIdToSourceIdsMap, relatedIdsMap } = linkIndex

  if (metaType === 'spec') {
    const metaId = rule.metaId
    if (ruleType === 'contains' || ruleType === 'is') {
      if (type === 'source') {
        return meta => {
          if (meta.id === metaId) return true
          if (sourceIdToTargetIdsMap.get(metaId)?.has(meta.id)) return true
          return false
        }
      }
      if (type === 'target') {
        return meta => {
          if (meta.id === metaId) return true
          if (targetIdToSourceIdsMap.get(metaId)?.has(meta.id)) return true
          return false
        }
      }
      if (type === 'related') {
        return meta => {
          if (meta.id === metaId) return true
          if (relatedIdsMap.get(metaId)?.has(meta.id)) return true
          return false
        }
      }
    }
    if (ruleType === 'not contains' || ruleType === 'is not') {
      if (type === 'source') {
        return meta => {
          if (!sourceIdToTargetIdsMap.get(metaId)?.has(meta.id)) return true
          return false
        }
      }
      if (type === 'target') {
        return meta => {
          if (!targetIdToSourceIdsMap.get(metaId)?.has(meta.id)) return true
          return false
        }
      }
      if (type === 'related') {
        return meta => {
          if (!relatedIdsMap.get(metaId)?.has(meta.id)) return true
          return false
        }
      }
    }
  } else {
    const group = rule.group
    const transformedFunc = await transformFilterGroupToFilterArray(group)

    if (transformedFunc) {
      // find relationships of these objects
      const leftObjects = Array.from(MetaStore.getMetaObjectsMap().values()).filter(transformedFunc)
      if (ruleType === 'contains' || ruleType === 'is') {
        if (type === 'source') {
          return meta => {
            if (leftObjects.some(o => sourceIdToTargetIdsMap.get(o.id)?.has(meta.id))) return true
            return false
          }
        } else if (type === 'target') {
          return meta => {
            if (leftObjects.some(o => targetIdToSourceIdsMap.get(o.id)?.has(meta.id))) return true
            return false
          }
        } else if (type === 'related') {
          return meta => {
            if (leftObjects.some(o => relatedIdsMap.get(o.id)?.has(meta.id))) return true
            return false
          }
        }
      }
      if (ruleType === 'not contains' || ruleType === 'is not') {
        if (type === 'source') {
          return meta => {
            if (leftObjects.every(o => !sourceIdToTargetIdsMap.get(o.id)?.has(meta.id))) return true
            return false
          }
        } else if (type === 'target') {
          return meta => {
            if (leftObjects.every(o => !targetIdToSourceIdsMap.get(o.id)?.has(meta.id))) return true
            return false
          }
        } else if (type === 'related') {
          return meta => {
            if (leftObjects.every(o => !relatedIdsMap.get(o.id)?.has(meta.id))) return true
            return false
          }
        }
      }
    }
  }
  return () => false
}

export default linkFilter
