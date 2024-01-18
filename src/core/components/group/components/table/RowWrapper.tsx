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

export const RowWrapper = memo(
  ({ rowDetails, path }: { rowDetails: MetaGroupChild; path: Path }) => {
    const bodyRef = useRef<HTMLDivElement>(null)
    const instance = useGroupInstance()
    const { renderIndicator } = useDragInRow({
      rowRef: bodyRef,
      value: rowDetails
    })

    const { checkIntersect, isSelected, clearSelectState, select } = useSelectCheck(bodyRef, rowDetails.rowId)
    useItemDrag(bodyRef, rowDetails)
    const renderCheckbox = useCheckboxSelect(isSelected, v => {
      if (v) {
        select()
      } else {
        clearSelectState()
      }
    })
    useEffect(() => {
      instance.values.inViewRowFuncs.set(rowDetails.rowId, {
        checkIntersected: checkIntersect,
        clearSelectState,
        select
      })
      return () => {
        instance.values.inViewRowFuncs.delete(rowDetails.rowId)
      }
    })

    if (!path) return null
    const renderRowContent = () => {
      if (rowDetails.type === 'metaObject') {
        return (
          <MetaRow
            rowDetails={rowDetails}
            renderCheckbox={renderCheckbox}
            path={path}
            rowRef={bodyRef}
            renderIndicator={renderIndicator}
            isSelected={isSelected}
          />
        )
      }
      if (rowDetails.type === 'text') {
        return (
          <TextRow
            rowDetails={rowDetails}
            renderCheckbox={renderCheckbox}
            path={path}
            rowRef={bodyRef}
            renderIndicator={renderIndicator}
            isSelected={isSelected}
          />
        )
      }
      return null
    }
    return renderRowContent()
  },
  (prev, curr) => prev.rowDetails === curr.rowDetails && Path.equals(prev.path, curr.path)
)
