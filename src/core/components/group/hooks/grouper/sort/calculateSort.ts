import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import { DateGroupRule, DateSort, NumberGroupRule, StringGroupRule, StringSort } from '~/typings/components/group/property-group'
import { relativeDates } from '@/core/components/group/hooks/grouper/calculator/date'
import { EMPTY_GROUPER_NAME } from '@/core/components/group/hooks/grouper/useBuildGrouper'

const relativeToDate = (r: relativeDates, sort: DateSort) => {
  const now = new Date()
  switch (r) {
    case 'today':
      return now.getTime()
    case 'yesterday':
      now.setDate(now.getDate() - 1)
      return now.getTime()
    case 'tomorrow':
      now.setDate(now.getDate() + 1)
      return now.getTime()
    case 'last7days':
      now.setDate(now.getDate() - 7)
      return now.getTime()
    case 'last30days':
      now.setDate(now.getDate() - 30)
      return now.getTime()
    case 'next7days':
      now.setDate(now.getDate() + 7)
      return now.getTime()
    case 'next30days':
      now.setDate(now.getDate() + 30)
      return now.getTime()
    case EMPTY_GROUPER_NAME:
      return sort === 'newestFirst' ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER
    default: {
      try {
        const num = Number(r)
        if (Number.isNaN(num)) {
          return Number.MIN_SAFE_INTEGER
        }
        return num
      } catch (e) {
        return Number.MIN_SAFE_INTEGER
      }
    }
  }
}

export default (groups: IGroupGrouper[], rule: StringGroupRule | DateGroupRule | NumberGroupRule) => {
  const sort = rule.sort
  switch (sort) {
    case 'newestFirst': {
      groups.sort((b, a) => {
        const s = relativeToDate(a.name, sort) - relativeToDate(b.name, sort)
        return s
      })
      break
    }
    case 'oldestFirst': {
      groups.sort((a, b) => relativeToDate(a.name, sort) - relativeToDate(b.name, sort))
      break
    }
    case 'alphabetical': {
      groups.sort((a, b) => {
        if (b.name === EMPTY_GROUPER_NAME) {
          return -1
        }
        if (a.name === EMPTY_GROUPER_NAME) {
          return 1
        }
        return a.name.localeCompare(b.name)
      })
      break
    }
    case 'reverseAlphabetical': {
      groups.sort((a, b) => {
        if (b.name === EMPTY_GROUPER_NAME) {
          return -1
        }
        if (a.name === EMPTY_GROUPER_NAME) {
          return 1
        }
        return -a.name.localeCompare(b.name)
      })
      break
    }
    case 'ascending':
      groups.sort((a, b) => {
        if (b.name === EMPTY_GROUPER_NAME) {
          return -1
        }
        if (a.name === EMPTY_GROUPER_NAME) {
          return 1
        }
        const aNum = Number(a.name)
        const bNum = Number(b.name)
        console.log(aNum, bNum)
        if (Number.isNaN(bNum)) {
          return -1
        }
        if (Number.isNaN(aNum)) {
          return 1
        }
        return aNum - bNum
      })
      break
    case 'descending':
      groups.sort((a, b) => {
        if (b.name === EMPTY_GROUPER_NAME) {
          return -1
        }
        if (a.name === EMPTY_GROUPER_NAME) {
          return 1
        }
        const aNum = Number(a.name)
        const bNum = Number(b.name)
        if (Number.isNaN(bNum)) {
          return 1
        }
        if (Number.isNaN(aNum)) {
          return 1
        }
        return bNum - aNum
      })
      break
  }
}
