type StringSort = 'alphabetical' | 'reverseAlphabetical' | 'manual'
type DateSort = 'oldestFirst' | 'newestFirst'
type NumberSort = 'ascending' | 'descending'
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
  fieldType: 'singleSelect' | 'multiSelect'
  sort: StringSort
}
export type NumberGroupRule = {
  fieldType: 'number'
  groupRange: {
    from: number
    to: number
  }
  groupEvery: number
  sort: NumberSort
}

export type MetaTypeGroupRule = {
  fieldType: 'metaType'
  sort: 'manual'
}

export type IGroupRule = SelectGroupRule | NumberGroupRule | StringGroupRule | DateGroupRule | CheckboxGroupRule | MetaTypeGroupRule
