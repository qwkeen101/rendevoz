import { MetaGroupChild } from '~/typings'
import { useSelectAtomValue } from '@/hooks'
import { GroupAtomAtom } from '@/core/group/hooks/useTableState'
import { useAtomValue } from 'jotai/index'
import { useEffect, useRef } from 'react'
import { PATH_TO_ELEMENT_MAP } from '@/core/group/hooks/weakmaps'
import useDragInRow from '@/core/group/hooks/drag/useDragInRow'
import useSelectCheck from '@/core/group/hooks/select/useSelectCheck'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import useItemDrag from '@/core/group/hooks/drag/useItemDrag'
import MetaRow from '@/core/group/components/table/rows/MetaRow'
import TextRow from '@/core/group/components/table/rows/TextRow'
import { Content } from '@/components'
import useCheckboxSelect from '@/core/group/hooks/select/useCheckboxSelect'

export const RowWrapper = ({ rowDetails, path }: { rowDetails: MetaGroupChild; path: number[] }) => {
  const groupAtom = useAtomValue(GroupAtomAtom)
  const wrap = useSelectAtomValue(groupAtom, s => s?.tableProperties?.wrapColumns)
  const bodyRef = useRef<HTMLDivElement>(null)
  const instance = useGroupInstance()

  const { renderIndicator } = useDragInRow({
    rowRef: bodyRef,
    value: rowDetails
  })
  useEffect(() => {
    PATH_TO_ELEMENT_MAP.get(instance)?.set(path.join(','), rowDetails)
  }, [...path])
  useEffect(() => {}, [])
  const { checkIntersect, isSelected, clearSelectState, select } = useSelectCheck(bodyRef, rowDetails.rowId)
  useItemDrag(bodyRef, rowDetails)
  const renderCheckbox = useCheckboxSelect(isSelected, v => {
    if (v) {
      select()
    } else {
      clearSelectState()
    }
  })
  console.log(rowDetails)
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
  }

  return renderRowContent()
}
