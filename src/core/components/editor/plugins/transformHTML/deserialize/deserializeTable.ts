import Id from '@/utils/id'
import { TableElement, TableRowElement } from '~/typings'
import {
  deserializeHTMLChildren,
  deserializeOptions,
  deserializeRoot,
  wrapElements
} from '@/core/components/editor/plugins/transformHTML/deserializeHTML'

export default (node: HTMLTableElement, opts?: deserializeOptions) => {
  const head = node.querySelector('thead')
  const cellSize = opts?.minTableCellWidth ?? 150
  const tableSize = opts?.tableWidth ?? 799
  const tableEle: TableElement = {
    id: Id.getId(),
    type: 'table',
    children: [],
    columns: []
  }
  const body = node.querySelector('tbody')
  if (!body) return null
  const bodyRows = Array.from(body.children).filter(i => i.nodeName === 'TR')
  if (head) {
    const headRow = Array.from(head.children).find(i => i.nodeName === 'TR')
    if (!headRow) return null
    const ths = Array.from(headRow.children).filter(i => i.nodeName === 'TH')
    const colNames = ths.map(() => Id.getStrId())
    tableEle.columns = ths.map((i, idx) => ({
      accessor: colNames[idx],
      width: Math.floor(Math.max(cellSize, tableSize / ths.length))
    }))
    tableEle.children.push({
      type: 'tableRow',
      id: Id.getId(),
      children: ths.map((i, idx) => ({
        type: 'tableCell',
        id: Id.getId(),
        colName: colNames[idx],
        children: [
          {
            type: 'paragraph',
            id: Id.getId(),
            children: [{ text: i.innerText || i.textContent }]
          }
        ]
      }))
    })
  } else {
    let colSize = 0
    bodyRows.forEach((row, idx) => {
      const tds = Array.from(row.children).filter(i => i.nodeName === 'TD' || i.nodeName === 'TH')
      if (idx === 0) {
        colSize = tds.length
      } else {
        if (colSize !== tds.length) {
          colSize = Math.max(tds.length, colSize)
        }
      }
    })
    tableEle.columns = Array.from(Array(colSize)).map(() => ({
      accessor: Id.getStrId(),
      width: Math.floor(Math.max(cellSize, tableSize / colSize))
    }))
  }

  if (body) {
    bodyRows.forEach(row => {
      const tds = Array.from(row.children).filter(i => i.nodeName === 'TD' || i.nodeName === 'TH')
      const normalizedRow: TableRowElement = {
        type: 'tableRow',
        id: Id.getId(),
        children: tableEle.columns.map((i, idx) => ({
          type: 'tableCell',
          colName: i.accessor,
          children: tds[idx]
            ? wrapElements(
                deserializeHTMLChildren(tds[idx]).filter(i => i.type !== 'table' && i.type !== 'image'),
                'paragraph',
                true
              )
            : [{ type: 'paragraph', id: Id.getId(), children: [{ text: '' }] }]
        }))
      }
      // not empty row
      if (
        !normalizedRow.children.every(
          i =>
            i.children.length === 1 &&
            i.children[0].type === 'paragraph' &&
            i.children[0].children.length === 1 &&
            i.children[0].children[0].text === ''
        )
      ) {
        tableEle.children.push(normalizedRow)
      }
    })
  }
  return tableEle
}
