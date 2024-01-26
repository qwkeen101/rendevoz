import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { useEffect, useMemo, useState } from 'react'
import { atom, useAtom, useAtomValue } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import scrollIntoView from 'scroll-into-view-if-needed'

const TableCellSelectAtom = atom<
  | {
      rowId: number
      index: number
    }
  | undefined
>(undefined)
export default function assignViewTableOps(instance: IGroupInstance) {
  const [tableCellState, setTableCellState] = useAtom(TableCellSelectAtom)
  useEffect(() => {
    if (tableCellState) {
      const ele = instance.getOuterContainer?.().querySelector(`[data-cell="${tableCellState.rowId}-${tableCellState.index}"]`)
      if (ele) {
        scrollIntoView(ele, {
          behavior: 'auto',
          scrollMode: 'if-needed',
          block: 'center'
        })
      }
      const clickHandler = (e: MouseEvent) => {
        if (
          e.target instanceof HTMLElement &&
          e.target.closest('[role="body-container"]') &&
          (!instance.getOuterContainer?.().contains(e.target) ||
            !e.target.closest(`[data-cell="${tableCellState.rowId}-${tableCellState.index}"]`))
        ) {
          setTableCellState(undefined)
        }
      }
      document.addEventListener('pointerdown', clickHandler)
      return () => {
        document.removeEventListener('pointerdown', clickHandler)
      }
    }
  }, [tableCellState])
  assignProperties(instance, {
    viewOps: {
      ...instance.viewOps,
      tableOps: {
        deselectCell: () => setTableCellState(undefined),
        navigateCell: direction => {
          if (!tableCellState) return
          // row index in current view
          const currentViewVisibleValues = instance.valueOps?.getVisibleValues()
          if (!currentViewVisibleValues) return
          const maxIndex = (instance.viewOps?.getVisibleProperties() ?? []).length - 1
          const rowIndex = currentViewVisibleValues.findIndex(i => (i[0].tempRowId || i[0].rowId) === tableCellState.rowId)
          const canUp = rowIndex >= 1
          const canDown = rowIndex >= 0 && rowIndex < currentViewVisibleValues.length - 1
          switch (direction) {
            case 'down': {
              if (!canDown) return
              const next = currentViewVisibleValues[rowIndex + 1][0]
              const nextRow = next.tempRowId || next.rowId
              setTableCellState({ rowId: nextRow, index: tableCellState.index })
              break
            }
            case 'left': {
              // navigate up
              if (tableCellState.index === 0) {
                if (canUp) {
                  const prev = currentViewVisibleValues[rowIndex - 1][0]
                  const prevRow = prev.tempRowId || prev.rowId
                  setTableCellState({ rowId: prevRow, index: maxIndex })
                }
              } else {
                setTableCellState({ rowId: tableCellState.rowId, index: tableCellState.index - 1 })
              }
              break
            }
            case 'right': {
              //  navigate down
              if (tableCellState.index >= maxIndex) {
                if (canDown) {
                  const next = currentViewVisibleValues[rowIndex + 1][0]
                  const nextRow = next.tempRowId || next.rowId
                  setTableCellState({ rowId: nextRow, index: 0 })
                }
              } else {
                setTableCellState({ rowId: tableCellState.rowId, index: tableCellState.index + 1 })
              }
              break
            }
            case 'up': {
              if (!canUp) return
              const prev = currentViewVisibleValues[rowIndex - 1][0]
              const prevRow = prev.tempRowId || prev.rowId
              setTableCellState({ rowId: prevRow, index: tableCellState.index })
              break
            }
          }
        },
        useSelectedCell: (rowId, index) => {
          const a = useMemo(() => {
            return atom(get => {
              const v = get(TableCellSelectAtom)
              const popoverVisible = get(GroupStateAtom).popoverVisible
              if (popoverVisible) return false
              if (!v) return false
              if (v.rowId === rowId && v.index === index) return true
              return false
            })
          }, [rowId, index])
          return useAtomValue(a)
        },
        getCurrentSelectedCell: () => tableCellState,
        selectCell: (rowId, index) => {
          const viewType = instance.getCurrentView?.()?.type
          if (viewType !== 'table') return
          setTableCellState({ rowId, index })
        }
      }
    }
  })
}
