import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { CustomElement, TableCellElement, TableElement } from '~/typings'
import { Editor, Path, Range, Transforms } from 'slate'
import { createContext, RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMemoizedFn, useMergedRef, useSelectAtomValue } from '@/hooks'
import produce from 'immer'
import { ID_TO_PATH_MAP } from '../../weakMaps'
import Id from '@/utils/id'
import useReadOnlyEditor from '../../hooks/useReadOnly'
import { atom, createStore, Provider } from 'jotai'
import TableSeletionOverlay from '@/core/components/editor/elements/table/TableSeletionOverlay'
import TableInsertHandle from '@/core/components/editor/elements/table/TableInsertHandle'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import { Utils } from 'rendevoz'

export const TableContext = createContext<
  | {
      onRowEnter: (rowIndex: number) => void
      onRowLeave: (rowIndex: number) => void
      hoveredCell: Path
    }
  | undefined
>(undefined)
export const TableStateAtom = atom<{
  hoveredCellPath?: Path
  selectionState?: { element: TableCellElement; path: Path }[]
  selectionBoxOffset?: {
    left?: number
    top?: number
  }
  isResizing?: boolean
  tableSelected?: boolean
  isReordering?: boolean
  reorderState?: {
    type: 'row' | 'column'
    elements: TableCellElement[]
    direction: 'top' | 'bottom' | 'left' | 'right'
  }
}>({})
const Table = ({ element, children }: RenderElementProps) => {
  const tableEle = element as TableElement & CustomElement
  const editor = useSlateStatic()
  const tablePath = ReactEditor.findPath(editor, element)
  const innerTableRef = useRef<HTMLTableSectionElement>(null)
  const tableRef = useMergedRef(innerTableRef)
  const readOnly = useReadOnlyEditor()
  const store = useMemo(() => createStore(), [])
  const blockSelected = useSelectAtomValue(EditorStateAtom, s => s.selectedBlockIdSet)?.has(element.id)
  useEffect(() => {
    store.set(TableStateAtom, { ...store.get(TableStateAtom), tableSelected: blockSelected })
  }, [blockSelected])

  const handleResizeTable = useMemoizedFn((c: number, r: number) => {
    Editor.withoutNormalizing(editor, () => {
      const columns = Math.max(c, 1)
      const rows = Math.max(r, 1)
      const currRowLength = tableEle.children.length
      const currColumnLength = tableEle.columns.length
      let draft = Editor.node(editor, tablePath)[0] as TableElement

      if (columns !== currColumnLength) {
        if (columns < currColumnLength) {
          Transforms.setNodes(
            editor,
            {
              columns: draft.columns.slice(0, columns)
            },
            { at: tablePath }
          )

          draft.children.forEach((c, idx) => {
            const rowPath = [...tablePath, idx]
            const row = Editor.node(editor, rowPath)[0]
            Transforms.removeNodes(editor, {
              at: [...rowPath, row.children.length - 1]
            })
          })
        } else {
          const range = Utils.range(0, columns - currColumnLength - 1)
          const newColumns = [...draft.columns, ...range.map(i => ({ width: 200, accessor: Id.getStrId() }))]
          Transforms.setNodes(
            editor,
            {
              columns: newColumns
            },
            { at: tablePath }
          )
          draft.children.forEach((c, idx) => {
            const rowPath = [...tablePath, idx]
            range.forEach((n, idx) => {
              Transforms.insertNodes(
                editor,
                {
                  id: Id.getId(),
                  type: 'tableCell',
                  colName: newColumns[c.children.length + idx].accessor,
                  children: [{ type: 'paragraph', id: Id.getId(), children: [{ text: '' }] }]
                },
                {
                  at: [...rowPath, c.children.length + idx]
                }
              )
            })
          })
        }
      }
      if (rows !== currRowLength) {
        draft = Editor.node(editor, tablePath)[0] as TableElement
        if (rows < currRowLength) {
          const range = Utils.range(0, currRowLength - rows - 1)
          range.forEach((n, idx) => {
            Transforms.removeNodes(editor, {
              at: [...tablePath, rows + idx]
            })
          })
        }
        if (rows > currRowLength) {
          const range = Utils.range(0, rows - currRowLength - 1)
          range
            .map(() => ({
              id: Id.getId(),
              type: 'tableRow',
              children: draft.columns.map(i => ({
                id: Id.getId(),
                colName: i.accessor,
                type: 'tableCell',
                children: [{ type: 'paragraph', id: Id.getId(), children: [{ text: '' }] }]
              }))
            }))
            .forEach((c, idx) => {
              Transforms.insertNodes(editor, c, {
                at: [...tablePath, currRowLength + idx]
              })
            })
        }
      }
    })
  })

  const canExecute = useRef(true)
  const handleInsertHandleDrag = useMemoizedFn((e: PointerEvent, direction: 'row' | 'column' | 'both', type: 'dragStart' | 'drag') => {
    if (type === 'dragStart') {
    }
    const exec = () => {
      canExecute.current = false
      setTimeout(() => {
        canExecute.current = true
      }, 0)
    }
    if (type === 'drag') {
      if (!canExecute.current) return
      if (direction === 'row') {
        const tableEle = Editor.node(editor, tablePath)[0] as TableElement
        const lastRowNode = ReactEditor.toDOMNode(editor, tableEle.children[tableEle.children.length - 1])
        const lastRowBounding = lastRowNode.getBoundingClientRect()
        if (e.clientY < lastRowBounding.top) {
          exec()

          handleResizeTable(tableEle.columns.length, tableEle.children.length - 1)
        }
        if (e.clientY > lastRowBounding.bottom + 20) {
          exec()
          const nextRow = tableEle.children.length + 1

          handleResizeTable(tableEle.columns.length, nextRow)
        }
      }
      if (direction === 'column') {
        const tableEle = Editor.node(editor, tablePath)[0] as TableElement
        const firstRow = tableEle.children[0]
        const lastColumnNode = ReactEditor.toDOMNode(editor, firstRow.children[firstRow.children.length - 1])
        const lastColumnBounding = lastColumnNode.getBoundingClientRect()
        if (e.clientX > lastColumnBounding.right + 20) {
          exec()
          handleResizeTable(tableEle.columns.length + 1, tableEle.children.length)
        }
        if (e.clientX < lastColumnBounding.left - 20) {
          exec()
          handleResizeTable(tableEle.columns.length - 1, tableEle.children.length)
        }
      }
      if (direction === 'both') {
      }
    }
  })
  const handleInsert = useMemoizedFn((direction: 'row' | 'column' | 'both') => {
    switch (direction) {
      case 'both': {
        handleResizeTable(tableEle.columns.length + 1, tableEle.children.length + 1)
        return
      }
      case 'column': {
        handleResizeTable(tableEle.columns.length + 1, tableEle.children.length)
        return
      }
      case 'row': {
        handleResizeTable(tableEle.columns.length, tableEle.children.length + 1)
        return
      }
    }
  })
  return (
    <Provider store={store}>
      <div
        style={{
          width: 'fit-content',
          '--placeholder': "''"
        }}
      >
        <div
          style={{
            position: 'relative',
            cursor: 'default',
            padding: 1,
            width: 'fit-content'
          }}
          // contentEditable={'false'}
          className={'selectable'}
        >
          {!readOnly && (
            <>
              <TableSeletionOverlay />
              <TableInsertHandle
                direction={'column'}
                tableElement={element}
                onDragStart={() => {
                  store.set(TableStateAtom, { ...store.get(TableStateAtom), isResizing: true })
                }}
                onDragEnd={() => {
                  store.set(TableStateAtom, { ...store.get(TableStateAtom), isResizing: false })
                }}
                onDrag={e => handleInsertHandleDrag(e, 'column', 'drag')}
                onInsert={() => {
                  handleInsert('column')
                }}
              />
              <TableInsertHandle
                direction={'row'}
                tableElement={element}
                onDragStart={() => {
                  console.log('start')
                  store.set(TableStateAtom, { ...store.get(TableStateAtom), isResizing: true })
                }}
                onDragEnd={() => {
                  store.set(TableStateAtom, { ...store.get(TableStateAtom), isResizing: false })
                }}
                onDrag={e => handleInsertHandleDrag(e, 'row', 'drag')}
                onInsert={() => {
                  handleInsert('row')
                }}
              />
              <TableInsertHandle
                direction={'both'}
                tableElement={element}
                onDragStart={() => {
                  store.set(TableStateAtom, { ...store.get(TableStateAtom), isResizing: true })
                }}
                onDragEnd={() => {
                  store.set(TableStateAtom, { ...store.get(TableStateAtom), isResizing: false })
                }}
                onDrag={e => handleInsertHandleDrag(e, 'both', 'drag')}
                onInsert={() => {
                  handleInsert('both')
                }}
              />
            </>
          )}
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
    </Provider>
  )
}

export default Table
