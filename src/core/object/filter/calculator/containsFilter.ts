import { ContainFilterRule, MetaObject } from '~/typings'
import calculateContains from '@/core/object/objectList/calculateContains'
import { MetaStore } from '@/api/stores'

export default async (rule: ContainFilterRule): Promise<(o: MetaObject) => boolean> => {
  if (!rule.value) {
    return () => true
  } else {
    const meta = MetaStore.getCachedMetaObject(rule.value)
    if (!meta) return () => true
    const targetContains = await calculateContains(meta)
    if (!targetContains || !targetContains.length) {
      return () => false
    }
    const containIds = new Set(targetContains.map(i => i.id))
    return o => containIds.has(o.id)
  }
}
