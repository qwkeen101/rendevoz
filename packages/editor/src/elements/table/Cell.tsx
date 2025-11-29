import { useMemoizedFn, useMergedRef, useRafFn, useSelectAtomValue, useToggle } from '@/hooks'
import { css } from '@emotion/css'
import produce from 'immer'
import { useEffect, useMemo, useRef } from 'react'
import { Path, Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useSlate } from '../../slate-react'
import { NODE_TO_INDEX, NODE_TO_PARENT } from '../../slate-react/utils/weak-maps'
import { CustomElement, IEditorInnerEvents, TableCellElement, TableElement, TableRowElement } from '~/typings'
import ClassName from '@/styles/classNames'
import Colors from '@/consts/colors'
import useEditorInstance from '../hooks/useEditorInstance'
import DragHandle from '../elements/table/TableCellDragHandle'
import { useAtomValue, useSetAtom } from 'jotai'
import { TableStateAtom } from '../elements/table/Table'
import getColumnsCells from '../elements/table/utils/getColumnsCells'
import getNearColumn from '../elements/table/utils/getNearColumn'
import reorderColumns from '../elements/table/utils/reorderColumns'
import { selectAtom } from 'jotai/utils'
import getRowCells from '../elements/table/utils/getRowCells'
import reorderRows from '../elements/table/utils/reorderRows'
import getNearRow from '../elements/table/utils/getNearRow'
import { EditorStateAtom } from '../hooks/useEditorState'
import clearContent from '../elements/table/menu/clearContent'
import insert from '../elements/table/menu/insert'
import deleteColumn from '../elements/table/utils/deleteColumn'
import deleteRow from '../elements/table/utils/deleteRow'

const TableCellWrapperClassName = css({
  minHeight: 32,
  border: '1px solid var(--border-background)',
  position: 'relative'
})
const CellResizerWrapperClassName = css({
  position: 'absolute',
  right: 0,
  width: 0,
  top: 0,
  height: '100%',
  zIndex: 1
})
const CellResizerClassName = css({
  position: 'absolute',
  width: 3,
  marginLeft: -1,
  marginTop: -1,
  height: 'calc(100% + 2px)',
  cursor: 'col-resize',
  background: 'rgba(35,131,226)',
  transition: 'opacity 0.2s ease'
})
const reorderStateAtom = selectAtom(TableStateAtom, s => s.reorderState)
const hoverPathAtom = selectAtom(TableStateAtom, s => s.hoveredCellPath)
const tableSelectedAtom = selectAtom(TableStateAtom, s => s.tableSelected)
const tableResizingAtom = selectAtom(TableStateAtom, s => s.isResizing)
const readOnlyAtom = selectAtom(EditorStateAtom, s => s.readOnly)
const TableCell = ({
  element,
  children,
  attributes
}: Omit<RenderElementProps, 'element'> & {
  element: TableCellElement & CustomElement
}) => {
  const instance = useEditorInstance()
  const setTableState = useSetAtom(TableStateAtom)
  const hoveredCellPath = useAtomValue(hoverPathAtom)
  const editor = useSlate()
  const isTableResizing = useAtomValue(tableResizingAtom)
  const row = NODE_TO_PARENT.get(element) as TableRowElement | undefined
  const readOnly = useAtomValue(readOnlyAtom, { store: instance.values.editorLevelStore })
  const table = (row ? NODE_TO_PARENT.get(row) : undefined) as (CustomElement & TableElement) | undefined
  const isFirstRow = table && row && table?.children.indexOf(row) === 0
  const isFirstCell = row?.children.indexOf(element) === 0
  const [resizerVisible, toggleResizerVisible] = useToggle(false)
  const dragHandleVisible = useMemo(() => {
    let rowVisible = false,
      columnVisible = false
    if (hoveredCellPath) {
      const cellPath = ReactEditor.findPath(editor, element)
      if (isFirstRow) {
        // 在同一�?
        if (hoveredCellPath[hoveredCellPath.length - 1] === cellPath[cellPath.length - 1]) {
          columnVisible = true
        }
      }
      // 在同一�?
      if (isFirstCell) {
        if (cellPath[cellPath.length - 2] === hoveredCellPath[hoveredCellPath.length - 2]) {
          rowVisible = true
        }
      }
    }
    return {
      rowVisible,
      columnVisible
    }
  }, [hoveredCellPath])
  const reorderState = useAtomValue(reorderStateAtom)
  const tableSelected = useAtomValue(tableSelectedAtom)
  const [resizing, toggleResizing] = useToggle(false)
  const [selected, toggleSelected] = useToggle(false)
  const columnInitialWidth = useRef<number>()
  const initialClientX = useRef<number>()
  const tdRef = useRef<HTMLTableCellElement>(null)
  const mergedRef = useMergedRef(attributes.ref, tdRef)
  const handler = ({ colName, type, tableId }: IEditorInnerEvents['tableCellOps']) => {
    if (table?.id !== tableId) return
    if (type === 'selectCol') {
      if (colName === element.colName) {
        setTimeout(() => toggleSelected(true))
      }
    }
    if (type === 'pointerEnterResizer') {
      if (colName === element.colName) {
        toggleResizerVisible(true)
      }
    }
    if (type === 'pointerLeaveResizer') {
      if (colName === element.colName) {
        toggleResizerVisible(false)
      }
    }
  }

  const getRowIndex = () => {
    const path = ReactEditor.findPath(editor, element)
    const parent = Path.parent(path)
    const rowIndex = parent.pop()
    return rowIndex
  }

  const rowIndex = getRowIndex()

  const isHeaderColumnCell = element.colName === table?.columns?.[0].accessor && table.headerColumn
  const isHeaderRowCell = row && NODE_TO_INDEX.get(row) === 0 && table?.headerRow
  const isHeader = isHeaderColumnCell || isHeaderRowCell
  useEffect(() => {
    instance.addEventListener?.('tableCellOps', handler)
    return () => {
      instance.removeEventListener?.('tableCellOps', handler)
    }
  })

  useEffect(() => {
    if (selected) {
      const clickHandler = () => {
        toggleSelected(false)
      }
      document.addEventListener('click', clickHandler)
      return () => {
        document.removeEventListener('click', clickHandler)
      }
    }
  }, [selected])
  const isReordering = useSelectAtomValue(TableStateAtom, s => s.isReordering)
  const resizerDragHandler = useMemoizedFn((e: PointerEvent) => {
    const table = (row ? NODE_TO_PARENT.get(row) : undefined) as (CustomElement & TableElement) | undefined
    if (!table || !initialClientX.current) return
    const tablePath = instance.getElementPathById(table.id)
    if (e.type === 'pointermove') {
      const targetColumnIndex = table.columns.findIndex(i => i.accessor === element.colName)
      if (targetColumnIndex >= 0) {
        const colGroup = tdRef.current?.closest('table')?.firstElementChild
        if (colGroup && colGroup.nodeName === 'COLGROUP') {
          const col = colGroup.children[targetColumnIndex]
          const colWidth = parseInt(col.getAttribute('width') || '150')
          if (!columnInitialWidth.current) {
            columnInitialWidth.current = colWidth
          }
          const offset = initialClientX.current! - e.clientX
          const containerWidth = colGroup.parentElement?.parentElement?.style.width
          if (containerWidth) {
            const properWidth = Math.max(columnInitialWidth.current - offset, 100)
            col.setAttribute('width', properWidth.toString())
            let allWidth = 0
            colGroup.childNodes.forEach(i => {
              const w = (i as HTMLElement).getAttribute('width')
              if (w) {
                allWidth += parseInt(w)
              }
            })
            const s = colGroup.parentElement?.parentElement?.style
            if (s) {
              s.width = `${allWidth}px`
            }
          }
        }
      }
    }
    if (e.type === 'pointerup') {
      toggleResizing(false)
      columnInitialWidth.current = undefined
      const targetColumnIndex = table.columns.findIndex(i => i.accessor === element.colName)
      if (targetColumnIndex >= 0) {
        const colGroup = tdRef.current?.closest('table')?.firstElementChild
        if (colGroup && colGroup.nodeName === 'COLGROUP') {
          const col = colGroup.children[targetColumnIndex]
          const colWidth = parseInt(col.getAttribute('width') || '150')
          const newColumns = produce(table.columns, draft => {
            draft[targetColumnIndex].width = colWidth
          })
          Transforms.setNodes(
            editor,
            {
              columns: newColumns
            },
            { at: tablePath }
          )
        }
      }
    }
  })
  useEffect(() => {
    if (resizing) {
      document.addEventListener('pointermove', resizerDragHandler, true)
      document.addEventListener('pointerup', resizerDragHandler, true)
      document.body.classList.add(ClassName.disableUserSelect)
      return () => {
        columnInitialWidth.current = undefined
        document.removeEventListener('pointermove', resizerDragHandler, true)
        document.removeEventListener('pointerup', resizerDragHandler, true)
        document.body.classList.remove(ClassName.disableUserSelect)
        instance.emitEvent?.('tableCellOps', {
          type: 'pointerLeaveResizer',
          colName: element.colName,
          rowIndex,
          tableId: table?.id
        })
      }
    }
  }, [resizing])
  const colSpan = table && row ? table?.columns.length / row?.children.length : undefined
  const handleCellMenu = useMemoizedFn(
    (
      type:
        | 'headerRow'
        | 'insertAbove'
        | 'insertBelow'
        | 'delete'
        | 'clearContent'
        | 'headerColumn'
        | 'insertLeft'
        | 'insertRight'
        | 'delete'
        | 'clearContent',
      direction: 'top' | 'left'
    ) => {
      const column = direction === 'top'
      const tablePath = ReactEditor.findPath(editor, table)
      switch (type) {
        case 'clearContent': {
          clearContent(element, column ? 'column' : 'row', editor)
          break
        }
        case 'headerColumn':
          Transforms.setNodes(
            editor,
            {
              headerColumn: !table?.headerColumn
            },
            {
              at: tablePath
            }
          )
          break
        case 'headerRow':
          Transforms.setNodes(
            editor,
            {
              headerRow: !table?.headerRow
            },
            {
              at: tablePath
            }
          )
          break
        case 'insertLeft':
          insert('column', 'left', element, table, editor)
          break
        case 'insertRight':
          insert('column', 'right', element, table, editor)
          break
        case 'insertAbove':
          insert('row', 'top', element, table, editor)
          break
        case 'insertBelow':
          insert('row', 'bottom', element, table, editor)
          break
        case 'delete':
          column ? deleteColumn(element, table, editor) : deleteRow(element, table, editor)
          break
      }
    }
  )
  const handleHandleDrag = useRafFn(
    useMemoizedFn(
      (
        direction: 'top' | 'left',
        event:
          | { type: 'drag'; offset: { x: number; y: number }; e: PointerEvent }
          | { type: 'dragStart' }
          | { type: 'dragEnd' }
          | { type: 'pointerDown' }
          | { type: 'pointerUp' }
      ) => {
        switch (event.type) {
          case 'pointerUp': {
            setTableState(s => ({
              ...s,
              selectionBoxOffset: undefined,
              selectionState: undefined,
              reorderState: undefined,
              isReordering: false
            }))
            return
          }
          case 'dragStart': {
            setTableState(s => ({ ...s, isReordering: true }))
            return
          }
          case 'drag': {
            const { offset, e } = event
            if (direction === 'top') {
              const nearColumnCells = getNearColumn(e, editor, table, element)
              // @ts-ignore
              setTableState(s => ({
                ...s,
                selectionBoxOffset: {
                  top: 0,
                  left: -offset.x
                },
                reorderState: nearColumnCells
                  ? nearColumnCells.cells[0].element !== s.reorderState?.elements[0] || s.reorderState?.type !== 'column'
                    ? {
                        elements: nearColumnCells.cells.map(i => i.element),
                        type: 'column',
                        direction: nearColumnCells.direction
                      }
                    : s.reorderState
                  : undefined
              }))
            }
            if (direction === 'left') {
              const nearRowCells = getNearRow(e, editor, table, element)
              console.log(nearRowCells)
              // @ts-ignore
              setTableState(s => ({
                ...s,
                selectionBoxOffset: {
                  top: -offset.y,
                  left: 0
                },
                reorderState: nearRowCells
                  ? nearRowCells.cells[0] !== s.reorderState?.elements[0] || s.reorderState?.type !== 'row'
                    ? {
                        elements: nearRowCells.cells,
                        type: 'row',
                        direction: nearRowCells.direction
                      }
                    : s.reorderState
                  : undefined
              }))
            }

            return
          }
          case 'dragEnd': {
            setTableState(s => ({
              ...s,
              selectionBoxOffset: undefined,
              selectionState: undefined,
              reorderState: undefined,
              isReordering: false
            }))
            setTimeout(() => {
              if (reorderState) {
                if (direction === 'top') {
                  const targetCol = reorderState.elements[0].colName
                  const currCol = element.colName
                  reorderColumns(currCol, targetCol, reorderState.direction, table, editor)
                }
                if (direction === 'left') {
                  const targetRow = table?.children.find(i => i.children.includes(reorderState.elements[0]))
                  const currRow = row
                  if (targetRow && currRow) {
                    reorderRows(currRow, targetRow, reorderState.direction, table, editor)
                  }
                }
              }
            })
            return
          }
          case 'pointerDown': {
            if (direction === 'top') {
              setTimeout(() => {
                const sameColumnCells = getColumnsCells(editor, element)
                setTableState(s => ({ ...s, selectionState: sameColumnCells }))
              })
            }
            if (direction === 'left') {
              setTimeout(() => {
                const sameRowCells = getRowCells(editor, element)
                setTableState(s => ({ ...s, selectionState: sameRowCells }))
              })
            }
            return
          }
        }
      }
    )
  )
  return (
    <td
      id={String(element.id)}
      colSpan={colSpan}
      style={{
        whiteSpace: 'normal',
        position: 'relative',
        fontWeight: isHeader ? 700 : undefined,
        verticalAlign: isHeader ? 'middle' : 'top',
        padding: '7px 9px',
        background: isHeader ? Colors.Background.Secondary : undefined,
        textAlign: colSpan === table?.columns.length || isHeader ? 'center' : undefined
      }}
      onPointerLeave={() => {
        if (!isTableResizing) {
          setTableState(s => ({ ...s, hoveredCellPath: undefined }))
        }
        if (table) {
          instance.emitEvent?.('tableCellOps', {
            type: 'pointerLeaveCell',
            rowIndex,
            colName: element.colName,
            tableId: table.id
          })
        }
      }}
      onPointerEnter={() => {
        if (!isTableResizing && !readOnly) {
          setTableState(s => ({ ...s, hoveredCellPath: ReactEditor.findPath(editor, element) }))
        }
        if (table) {
          instance.emitEvent?.('tableCellOps', {
            type: 'pointerEnterCell',
            rowIndex,
            colName: element.colName,
            tableId: table.id
          })
        }
      }}
      data-col={element.colName}
      className={TableCellWrapperClassName}
      {...attributes}
      ref={mergedRef}
    >
      {isFirstCell && !readOnly && (
        <DragHandle
          menuOptions={{
            showHeader: !!isFirstRow,
            isHeader: !!table?.headerRow,
            on: i => handleCellMenu(i, 'left')
          }}
          onDragEnd={() => {
            handleHandleDrag('left', {
              type: 'dragEnd'
            })
          }}
          onPointerUp={() => {
            handleHandleDrag('left', {
              type: 'pointerUp'
            })
          }}
          onDrag={(e, info) => {
            handleHandleDrag('left', {
              type: 'drag',
              offset: info.offset,
              e
            })
          }}
          onDragStart={() => {
            handleHandleDrag('left', {
              type: 'dragStart'
            })
          }}
          onPointerDown={() =>
            handleHandleDrag('left', {
              type: 'pointerDown'
            })
          }
          direction={'left'}
          visible={dragHandleVisible.rowVisible && !isReordering && !tableSelected && !isTableResizing}
        />
      )}
      {isFirstRow && !readOnly && (
        <DragHandle
          menuOptions={{
            on: i => handleCellMenu(i, 'top'),
            isHeader: !!table?.headerColumn,
            showHeader: isFirstCell
          }}
          onDragEnd={() => {
            handleHandleDrag('top', {
              type: 'dragEnd'
            })
          }}
          onPointerUp={() => {
            handleHandleDrag('top', {
              type: 'pointerUp'
            })
          }}
          onDrag={(e, info) => {
            handleHandleDrag('top', {
              type: 'drag',
              offset: info.offset,
              e
            })
          }}
          onDragStart={() => {
            handleHandleDrag('top', {
              type: 'dragStart'
            })
          }}
          onPointerDown={() =>
            handleHandleDrag('top', {
              type: 'pointerDown'
            })
          }
          direction={'top'}
          visible={dragHandleVisible.columnVisible && !isReordering && !tableSelected && !isTableResizing}
        />
      )}
      {children}
      {selected && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: '#8590aea4'
          }}
        ></div>
      )}
      {!readOnly && (
        <div
          contentEditable={false}
          onPointerEnter={() => {
            table &&
              instance.emitEvent?.('tableCellOps', {
                type: 'pointerEnterResizer',
                colName: element.colName,
                rowIndex,
                tableId: table.id
              })
          }}
          onPointerLeave={() => {
            table &&
              !resizing &&
              instance.emitEvent?.('tableCellOps', {
                type: 'pointerLeaveResizer',
                colName: element.colName,
                rowIndex,
                tableId: table.id
              })
          }}
          className={CellResizerWrapperClassName}
          style={{
            background: resizing ? 'rgba(35,131,226)' : undefined
          }}
          onPointerDown={e => {
            if (readOnly) return
            toggleResizing()
            initialClientX.current = e.clientX
          }}
        >
          <div className={CellResizerClassName} style={{ opacity: resizerVisible ? 1 : 0 }}></div>
        </div>
      )}
      {reorderState?.elements.includes(element) && (
        <div
          contentEditable={false}
          className={CellResizerClassName}
          style={{
            left: reorderState.type === 'column' ? (reorderState.direction === 'left' ? -2 : 'calc(100% - 2px)') : 0,
            top: reorderState.type === 'row' ? (reorderState.direction === 'top' ? -2 : 'calc(100% - 2px)') : 0,
            position: 'absolute',
            background: Colors.Common.SelectColor,
            width: reorderState.type === 'column' ? 4 : 'calc(100% + 2px)',
            height: reorderState.type === 'column' ? 'calc(100% + 2px)' : 4
          }}
        ></div>
      )}
    </td>
  )
}

export default TableCell
