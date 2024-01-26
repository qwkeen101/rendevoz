import { MetaGroupChild } from '~/typings'
import { Path } from 'slate'
import { ReactElement, RefObject } from 'react'

export type IGroupRow = {
  rowDetails: MetaGroupChild
  rowRef: RefObject<HTMLElement>
  renderIndicator: () => ReactElement | null | undefined
  renderCheckbox: () => ReactElement
  isSelected: boolean
}

export type IGroupRowStateProps = {
  headerColumns?: any
  headers?: any
  showOriginalText?: boolean
  untoggledIdSet?: Set<number>
  showDeletedMeta?: boolean
  wrapContent?: boolean
  shiftKeyPressed?: boolean
}
