import { MetaObject, TagFieldFilterRule } from '~/typings'

function tagFilter<T extends MetaObject>(rule: TagFieldFilterRule): (o: T) => boolean {
  const ruleFilter = () => {
    const targetTagsSet = new Set([...(rule.tagIds || [])])
    switch (rule.type) {
      case 'is':
        return (sourceTags?: number[]) => {
          if (!sourceTags || sourceTags.length === 0) return false
          if (targetTagsSet.size === sourceTags.length && sourceTags.every(id => targetTagsSet.has(id))) return true
          return false
        }
      case 'contains':
        return (sourceTags?: number[]) => {
          if (sourceTags?.some(id => targetTagsSet.has(id))) return true
          return false
        }
      case 'not contains':
        return (sourceTags?: number[]) => {
          if (!sourceTags || !sourceTags.length) return false
          if (sourceTags?.every(id => !targetTagsSet.has(id))) return true
          return false
        }
      case 'empty':
        return (tags?: number[]) => !tags || tags.length === 0
      case 'not empty':
        return (tags?: number[]) => tags?.length !== 0
      case 'is not':
        return (sourceTags?: number[]) => {
          if (!sourceTags || sourceTags.length === 0) return false
          if (sourceTags.length !== targetTagsSet.size) return true
          if (sourceTags.length === targetTagsSet.size && sourceTags.every(i => targetTagsSet.has(i))) return false
          return true
        }
    }
  }
  const filter = ruleFilter()
  const func = (o: T) => {
    const tags = o['tags']

    return filter(tags)
  }
  return func
}

export default tagFilter
