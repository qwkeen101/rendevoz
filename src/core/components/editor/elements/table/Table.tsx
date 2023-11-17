import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { CustomElement, TableElement } from '~/typings'
import { Editor, Range, Transforms } from 'slate'
import { createContext, useLayoutEffect, useRef, useState } from 'react'
import { useDebounceFn, useMemoizedFn, useMergedRef, useToggle } from '@/hooks'
import produce from 'immer'
import TableSlot from './Slot'
import { ID_TO_PATH_MAP } from '../../weakMaps'
import Id from '@/utils/id'
import { useGlobalIsDragging } from '@/core/global'
import useReadOnlyEditor from '../../hooks/useReadOnly'

export const TableContext = createContext<
  | {
      onRowEnter: (rowIndex: number) => void
      onRowLeave: (rowIndex: number) => void
    }
  | undefined
>(undefined)

const Table = ({ element, children }: RenderElementProps) => {
  const tableEle = element as TableElement & CustomElement
  const editor = useSlateStatic()
  const tablePath = ReactEditor.findPath(editor, element)
  const innerTableRef = useRef<HTMLTableSectionElement>(null)
  const selected = editor.selection && tablePath && Range.intersection(Editor.range(editor, tablePath), editor.selection)

  const tableRef = useMergedRef(innerTableRef)
  const readOnly = useReadOnlyEditor()
  const [slotsVisible, toggleSlotsVisible] = useToggle(false)
  const [popoverVisible, togglePopoverVisible] = useToggle(false)
  const [rowSlots, setRowSlots] = useState<
    {
      height: number
      rowIndex: number
    }[]
  >([])
  const [columnSlots, setColumnSlots] = useState<
    {
      width: number
      colName: string
    }[]
  >()
  const [globalIsDragging] = useGlobalIsDragging()
  const showSlots = (slotsVisible || popoverVisible || selected) && !globalIsDragging && !readOnly
  const setRowAndColumnSlots = useMemoizedFn(() => {
    const rows: typeof rowSlots = []
    const columns: typeof columnSlots = []
    innerTableRef.current?.childNodes[0].childNodes.forEach((col, idx) => {
      columns.push({
        width: (col as HTMLElement).getBoundingClientRect().width,
        colName: tableEle.columns[idx].accessor
      })
    })
    innerTableRef.current?.childNodes.forEach((i, idx) =>
      rows.push({
        height: (i as HTMLElement).getBoundingClientRect().height + 0.1,
        rowIndex: idx
      })
    )
    setRowSlots(rows)
    setColumnSlots(columns)
  })
  const { run: debouncedSetRowsAndColumns } = useDebounceFn(setRowAndColumnSlots, { wait: 20 })
  useLayoutEffect(() => debouncedSetRowsAndColumns(), [element])

  const handleAddColumn = (colName: string, direction: 'before' | 'after') => {
    const tablePath = ReactEditor.findPath(editor, element)
    const newColName = `col${Id.getId()}`
    const currentColIdx = tableEle.columns.findIndex(i => i.accessor === colName)
    const nextIdx = direction === 'before' ? currentColIdx : currentColIdx + 1
    const newColumns = produce(tableEle.columns, draft => {
      draft.splice(Math.max(0, nextIdx), 0, {
        accessor: newColName,
        width: 150
      })
    })
    Transforms.setNodes(
      editor,
      {
        columns: newColumns
      },
      {
        at: tablePath
      }
    )
    tableEle.children.forEach((v, idx) => {
      const rowPath = [...tablePath, idx, v.children.length]
      Transforms.insertNodes(
        editor,
        {
          type: 'tableCell',
          colName: newColName,
          children: [
            {
              type: 'paragraph',
              children: [{ text: '' }],
              id: Id.getId()
            }
          ],
          id: Id.getId()
        },
        { at: rowPath }
      )
    })
    console.log(editor.children)
  }
  const handleAddRow = (rowIndex: number, direction: 'above' | 'below') => {
    const nextRowIndex = direction === 'above' ? rowIndex : rowIndex + 1
    const realRowIndex = Math.max(0, nextRowIndex)
    const cells = tableEle.columns.map(i => ({
      type: 'tableCell',
      id: Id.getId(),
      colName: i.accessor,
      children: [
        {
          type: 'paragraph',
          id: Id.getId(),
          children: [{ text: '' }]
        }
      ]
    }))
    Transforms.insertNodes(
      editor,
      {
        type: 'tableRow',
        children: cells
      },
      {
        at: [...tablePath, realRowIndex]
      }
    )
  }
  const handleDeleteColumn = (colName: string) => {
    const tablePath = ID_TO_PATH_MAP.get(editor)?.get(tableEle.id)
    if (!tablePath) return
    if (tableEle.columns.length === 1) {
      Transforms.removeNodes(editor, {
        at: tablePath
      })
      return
    }
    const newColumns = produce(tableEle.columns, draft => {
      const idx = tableEle.columns.findIndex(i => i.accessor === colName)
      draft.splice(idx, 1)
    })
    Transforms.setNodes(
      editor,
      {
        columns: newColumns
      },
      {
        at: tablePath
      }
    )
    tableEle.children.forEach((row, idx) => {
      const rowPath = [...tablePath, idx]
      row.children.forEach((cell, idx) => {
        const cellPath = [...rowPath, idx]
        if (cell.colName === colName) {
          Transforms.removeNodes(editor, {
            at: cellPath
          })
        }
      })
    })
  }
  const handleClearColumnContent = (colName: string) => {
    tableEle.children.forEach((row, rowIndex) => {
      row.children.forEach((cell, cellIndex) => {
        if (cell.colName === colName) {
          const cellPath = [...tablePath, rowIndex, cellIndex]
          const range = Editor.range(editor, [...cellPath, 0], [...cellPath, cell.children.length - 1])
          Transforms.removeNodes(editor, {
            at: range
          })
          Transforms.insertNodes(
            editor,
            {
              type: 'paragraph',
              id: Id.getId(),
              children: [{ text: '' }]
            },
            {
              at: [...cellPath, 0]
            }
          )
        }
      })
    })
  }
  const handleDeleteRow = (rowIndex: number) => {
    if (tableEle.children.length === 1) {
      Transforms.removeNodes(editor, { at: tablePath })
      return
    }
    Transforms.removeNodes(editor, { at: [...tablePath, rowIndex] })
  }
  const handleClearRowContent = (rowIndex: number) => {
    tableEle.children[rowIndex].children.forEach((cell, idx) => {
      const cellPath = [...tablePath, rowIndex, idx]
      const range = Editor.range(editor, [...cellPath, 0], [...cellPath, cell.children.length - 1])
      Transforms.removeNodes(editor, {
        at: range,
        voids: true
      })
      Transforms.insertNodes(
        editor,
        {
          type: 'paragraph',
          id: Id.getId(),
          children: [{ text: '' }]
        },
        {
          at: [...cellPath, 0]
        }
      )
    })
  }
  return (
    <div
      onPointerMove={() => toggleSlotsVisible(true)}
      onPointerLeave={e => {
        toggleSlotsVisible(false)
      }}
    >
      <div
        contentEditable={false}
        style={{
          position: 'absolute',
          left: -10,
          top: 0,
          opacity: showSlots ? 1 : 0,
          transition: 'opacity 0.2s ease',
          borderTopLeftRadius: 6,
          borderBottomLeftRadius: 6,
          overflow: 'hidden',
          width: 10
        }}
        data-table-slot
      >
        {showSlots &&
          rowSlots.map(i => (
            <TableSlot
              on={type => {
                switch (type) {
                  case 'delete':
                    handleDeleteRow(i.rowIndex)
                    break
                  case 'insertAbove':
                    handleAddRow(i.rowIndex, 'above')
                    break
                  case 'insertBelow':
                    handleAddRow(i.rowIndex, 'below')
                    break
                  case 'headerRow':
                    Transforms.setNodes(editor, { headerRow: !tableEle.headerRow }, { at: tablePath })
                    break
                  case 'clearContent':
                    handleClearRowContent(i.rowIndex)
                }
              }}
              key={i.rowIndex}
              showHeader={i.rowIndex === 0}
              isHeader={tableEle.headerRow}
              type="row"
              width={10}
              height={i.height}
              onPopoverVisible={v => {
                togglePopoverVisible(v)
              }}
            />
          ))}
      </div>
      <div
        contentEditable={false}
        style={{
          position: 'absolute',
          top: -10,
          display: 'flex',
          opacity: showSlots ? 1 : 0,
          transition: 'opacity 0.2s ease',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          overflow: 'hidden',
          width: '100%'
        }}
      >
        {showSlots &&
          columnSlots?.map(i => (
            <TableSlot
              onPopoverVisible={v => {
                togglePopoverVisible(v)
              }}
              showHeader={i.colName === tableEle.columns[0].accessor}
              isHeader={tableEle.headerColumn}
              on={type => {
                switch (type) {
                  case 'delete':
                    handleDeleteColumn(i.colName)
                    break
                  case 'insertLeft':
                    handleAddColumn(i.colName, 'before')
                    break
                  case 'insertRight':
                    handleAddColumn(i.colName, 'after')
                    break
                  case 'clearContent':
                    handleClearColumnContent(i.colName)
                    break
                  case 'headerColumn':
                    Transforms.setNodes(editor, { headerColumn: !tableEle.headerColumn }, { at: tablePath })
                }
              }}
              key={i.colName}
              type="column"
              width={i.width}
              height={10}
            />
          ))}
      </div>
      <div
        style={{
          maxWidth: '100%',
          overflowX: 'auto',
          position: 'relative',
          cursor: 'default',
          padding: 1,
          width: 'fit-content'
        }}
      >
        <div
          style={{
            position: 'relative',
            cursor: 'auto',
            width: tableEle.columns?.reduce((prev, curr) => {
              return prev + (curr.width || 150)
            }, 0),
            minWidth: readOnly ? '100%' : undefined,
            margin: readOnly ? 'auto' : undefined
          }}
        >
          <table>
            <colgroup>{tableEle.columns?.map(i => <col key={i.accessor} width={i.width || 150} />)}</colgroup>
            <tbody ref={tableRef} style={{ borderSpacing: '0px' }}>
              {children}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Table
