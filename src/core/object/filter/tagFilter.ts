import { MetaObject, TagFieldFilterRule } from '~/typings'

function tagFilter<T extends MetaObject>(rule: TagFieldFilterRule): (o: T) => boolean {
  const ruleFilter = () => {
    const targetTagsSet = new Set([...(rule.tagIds || [])])
    switch (rule.type) {
      case 'is':
        return (sourceTags: number[]) => {
          if (targetTagsSet.size === sourceTags.length && sourceTags.every(id => targetTagsSet.has(id))) return true
          return false
        }
      case 'contains':
        return (sourceTags: number[]) => {
          if (sourceTags.some(id => targetTagsSet.has(id))) return true
          return false
        }
      case 'not contains':
        return (sourceTags: number[]) => {
          if (sourceTags.every(id => !targetTagsSet.has(id))) return true
          return false
        }
      case 'empty':
        return (tags: number[]) => tags.length === 0
      case 'not empty':
        return (tags: number[]) => tags.length !== 0
      case 'is not':
        return (sourceTags: number[]) => {
          if (sourceTags.length !== targetTagsSet.size) return true
          if (sourceTags.length === targetTagsSet.size && sourceTags.every(i => targetTagsSet.has(i))) return false
          return true
        }
    }
  }
  const filter = ruleFilter()
  const emptyTags = rule.tagIds === undefined || rule.tagIds.length === 0
  const shouldPass = rule.type !== 'empty' && rule.type !== 'not empty' && emptyTags
  const notContains = rule.type === 'empty' || rule.type === 'is not' || rule.type === 'not contains'
  const func = (o: T) => {
    const tags = o['tags']
    if (shouldPass) {
      return true
    }
    if ((!tags || !Array.isArray(tags)) && notContains) return true
    if (tags) {
      return filter(tags)
    }
    return false
  }
  return func
}

export default tagFilter
