type StringSort = 'alphabetical' | 'reverseAlphabetical' | 'manual'
type DateSort = 'oldestFirst' | 'newestFirst'
export type StringGroupRule = {
  fieldType: 'string'
  textBy: 'alphabetical' | 'exact'
  sort: StringSort
}
export type DateGroupRule = {
  fieldType: 'date'
  dateBy: 'relative' | 'day' | 'week' | 'month' | 'year'
  sort: DateSort
}
export type CheckboxGroupRule = {
  fieldType: 'checkbox'
}
export type SelectGroupRule = {
  fieldType: 'select'
  sort: StringSort
}
export type NumberGroupRule = {
  fieldType: 'number'
  groupRange: {
    from: number
    to: number
  }
  groupEvery: number
  sort: 'asc' | 'desc'
}

export type IGroupRule = SelectGroupRule | NumberGroupRule | StringGroupRule | DateGroupRule | CheckboxGroupRule
