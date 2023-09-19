import { MetaGroup, MetaGroupChild } from '~/typings'

export const hasMetaInTable = (metaId: number, value: MetaGroup['value']) => {
  const loopFind = (v: Required<MetaGroup>['value'][0]): boolean => {
    if (v.children) {
      return v.children.some(s => loopFind(s))
    }
    return v.type === 'metaObject' && v.id === metaId
  }
  return value?.some(i => loopFind(i))
}

export const getAllMetasInTable = (value: MetaGroup['value']): Set<number> => {
  const set = new Set<number>()
  const loop = (v: Required<MetaGroup>['value'][0]) => {
    if (v.children) {
      v.children.forEach(s => loop(s))
    }
    if (v.type === 'metaObject') {
      set.add(v.id)
    }
  }
  value?.forEach(v => loop(v))
  return set
}
