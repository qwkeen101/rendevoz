import useScopedEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn, useMergedRef, useToggle } from '@/hooks'
import { css } from '@emotion/css'
import produce from 'immer'
import { useContext, useEffect, useRef } from 'react'
import { Path, Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useSlate, useSlateStatic } from '../../slate-react'
import { NODE_TO_INDEX, NODE_TO_PARENT } from '../../slate-react/utils/weak-maps'
import { CustomElement, TableCellElement, TableElement, TableRowElement } from '~/typings'
import { ID_TO_PATH_MAP } from '../../weakMaps'
import { useEventHandler } from '@/events/eventHandler'
import { useGlobalIsDragging } from '@/core'
import ClassName from '@/styles/classNames'
const TableCellWrapperClassName = css({
  minHeight: 32,
  border: '1px solid rgba(133, 144, 174, 0.4)',
  // borderBottom: '1px solid rgba(133, 144, 174, 0.4)',
  // minWidth: 240,
  // maxWidth: 320,
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
const TableCell = ({
  element,
  children,
  attributes
}: Omit<RenderElementProps, 'element'> & { element: TableCellElement & CustomElement }) => {
  const scopedEmitter = useScopedEventEmitter()
  const row = NODE_TO_PARENT.get(element) as TableRowElement | undefined
  const table = (row ? NODE_TO_PARENT.get(row) : undefined) as (CustomElement & TableElement) | undefined
  const [globalIsDragging] = useGlobalIsDragging()
  const [resizerVisible, toggleResizerVisible] = useToggle(false)
  const [resizing, toggleResizing] = useToggle(false)
  const [selected, toggleSelected] = useToggle(false)
  const columnInitialWidth = useRef<number>()
  const initialClientX = useRef<number>()
  const editor = useSlate()
  const handler = useEventHandler('editor')
  const tdRef = useRef<HTMLTableCellElement>(null)
  const mergedRef = useMergedRef(attributes.ref, tdRef)
  handler.on('tableCellOp', ({ colName, rowIndex, type, tableId }) => {
    if (table?.id !== tableId) return
    if (type === 'selectCol') {
      if (colName === element.colName) {
        setTimeout(() => toggleSelected(true))
      }
    }
    if (type === 'pointerEnterCell') {
    }
    if (type === 'pointerLeaveCell') {
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
  })

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
    scopedEmitter.addListener('editor', handler)
    return () => {
      scopedEmitter.removeListener('editor', handler)
    }
  }, [])
  useEffect(() => {
    if (globalIsDragging) {
      const pointerMoveHandler = (e: PointerEvent) => {
        editor.dragManager?.dragInTableCell(e)
      }
      tdRef.current?.addEventListener('pointermove', pointerMoveHandler)
      return () => {
        tdRef.current?.removeEventListener('pointermove', pointerMoveHandler)
      }
    }
  }, [globalIsDragging])
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
  const resizerDragHandler = useMemoizedFn((e: PointerEvent) => {
    const table = (row ? NODE_TO_PARENT.get(row) : undefined) as (CustomElement & TableElement) | undefined
    if (!table || !initialClientX.current) return
    const tablePath = ID_TO_PATH_MAP.get(editor)?.get(table.id)
    if (e.type === 'pointermove') {
      const newColumns = produce(table.columns, draft => {
        const targetColumn = draft.find(i => i.accessor === element.colName)
        if (targetColumn) {
          if (!columnInitialWidth.current) {
            columnInitialWidth.current = targetColumn.width || 150
          }
          const offset = initialClientX.current! - e.clientX
          const finalWidth =
            targetColumn.width !== undefined ? (targetColumn.width = columnInitialWidth.current - offset) : (targetColumn.width = 150)
          targetColumn.width = Math.max(finalWidth, 100)
        }
      })
      Transforms.setNodes(
        editor,
        {
          columns: newColumns
        },
        { at: tablePath }
      )
    }
    if (e.type === 'pointerup') {
      toggleResizing(false)
    }
  })
  useEffect(() => {
    if (resizing) {
      document.addEventListener('pointermove', resizerDragHandler)
      document.addEventListener('pointerup', resizerDragHandler)
      document.body.classList.add(ClassName.disableUserSelect)
      return () => {
        columnInitialWidth.current = undefined
        document.removeEventListener('pointermove', resizerDragHandler)
        document.removeEventListener('pointerup', resizerDragHandler)
        document.body.classList.remove(ClassName.disableUserSelect)
        scopedEmitter.emit('editor', {
          type: 'tableCellOp',
          data: {
            type: 'pointerLeaveResizer',
            colName: element.colName,
            rowIndex,
            tableId: table.id
          }
        })
      }
    }
  }, [resizing])
  const colSpan = table && row ? table?.columns.length / row?.children.length : undefined
  return (
    <td
      id={String(element.id)}
      colSpan={colSpan}
      style={{
        position: 'relative',
        fontWeight: isHeader ? 700 : undefined,
        verticalAlign: 'top',
        padding: '7px 9px',
        background: isHeader ? 'rgba(242,243,245)' : undefined,
        textAlign: colSpan === table?.columns.length ? 'center' : undefined
      }}
      onPointerLeave={() => {
        if (table) {
          scopedEmitter.emit('editor', {
            type: 'tableCellOp',
            data: {
              type: 'pointerLeaveCell',
              rowIndex,
              colName: element.colName,
              tableId: table.id
            }
          })
        }
      }}
      onPointerEnter={() => {
        if (table) {
          scopedEmitter.emit('editor', {
            type: 'tableCellOp',
            data: {
              type: 'pointerEnterCell',
              rowIndex,
              colName: element.colName,
              tableId: table.id
            }
          })
        }
      }}
      data-col={element.colName}
      className={TableCellWrapperClassName}
      {...attributes}
      ref={mergedRef}
    >
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
      <div
        onPointerEnter={() => {
          table &&
            scopedEmitter.emit('editor', {
              type: 'tableCellOp',
              data: {
                type: 'pointerEnterResizer',
                colName: element.colName,
                rowIndex,
                tableId: table.id
              }
            })
        }}
        onPointerLeave={() => {
          table &&
            !resizing &&
            scopedEmitter.emit('editor', {
              type: 'tableCellOp',
              data: {
                type: 'pointerLeaveResizer',
                colName: element.colName,
                rowIndex,
                tableId: table.id
              }
            })
        }}
        className={CellResizerWrapperClassName}
        style={{
          background: resizing ? 'rgba(35,131,226)' : undefined
        }}
        onPointerDown={e => {
          toggleResizing()
          initialClientX.current = e.clientX
        }}
      >
        <div className={CellResizerClassName} style={{ opacity: resizerVisible ? 1 : 0 }}></div>
      </div>
    </td>
  )
}

export default TableCell
