import { MetaGroupChild } from '~/typings'
import { memo, useEffect, useRef } from 'react'
import useDragInRow from '@/core/components/group/hooks/drag/useDragInRow'
import useSelectCheck from '@/core/components/group/hooks/select/useSelectCheck'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import useItemDrag from '@/core/components/group/hooks/drag/useItemDrag'
import MetaRow from '@/core/components/group/components/table/rows/MetaRow'
import TextRow from '@/core/components/group/components/table/rows/TextRow'
import useCheckboxSelect from '@/core/components/group/hooks/select/useCheckboxSelect'
import { Path } from 'slate'
import { IGroupRowStateProps } from '@/core/components/group/components/table/rows/types'

export const RowWrapper = memo(({ rowDetails, ...rest }: { rowDetails: MetaGroupChild } & IGroupRowStateProps) => {
  const bodyRef = useRef<HTMLDivElement>(null)
  const instance = useGroupInstance()
  const { renderIndicator } = useDragInRow({
    rowRef: bodyRef,
    value: rowDetails
  })

  const { checkIntersect, isSelected, clearSelectState, select, scrollIntoView } = useSelectCheck(bodyRef, rowDetails)
  useItemDrag(bodyRef, rowDetails)
  const renderCheckbox = useCheckboxSelect(isSelected, v => {
    if (v) {
      select()
    } else {
      clearSelectState()
    }
  })
  useEffect(() => {
    console.log(rowDetails)
    instance.values.inViewRowFuncs.set(rowDetails.tempRowId || rowDetails.rowId, {
      checkIntersected: checkIntersect,
      clearSelectState,
      select,
      scrollIntoView
    })
    return () => {
      instance.values.inViewRowFuncs.delete(rowDetails.tempRowId || rowDetails.rowId)
    }
  })

  const renderRowContent = () => {
    if (rowDetails.type === 'metaObject') {
      return (
        <MetaRow
          rowDetails={rowDetails}
          renderCheckbox={renderCheckbox}
          rowRef={bodyRef}
          renderIndicator={renderIndicator}
          isSelected={isSelected}
          {...rest}
        />
      )
    }
    if (rowDetails.type === 'text') {
      return (
        <TextRow
          rowDetails={rowDetails}
          renderCheckbox={renderCheckbox}
          rowRef={bodyRef}
          renderIndicator={renderIndicator}
          isSelected={isSelected}
          {...rest}
        />
      )
    }
    return null
  }
  return renderRowContent()
})
