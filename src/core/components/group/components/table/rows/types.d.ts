import { MetaGroupChild } from '~/typings'
import { Path } from 'slate'
import { ReactElement, RefObject } from 'react'

export type IGroupRow = {
  rowDetails: MetaGroupChild
  path: Path
  rowRef: RefObject<HTMLElement>
  renderIndicator: () => ReactElement | null | undefined
  renderCheckbox: () => ReactElement
  isSelected: boolean
}
