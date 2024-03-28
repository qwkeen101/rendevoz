import Id from '@/utils/id'
import { TableElement, TableRowElement } from '~/typings'

export default (node: HTMLTableElement) => {
  const head = node.querySelector('thead')
  const tableEle: TableElement = {
    id: Id.getId(),
    type: 'table',
    children: [],
    columns: []
  }
  if (head) {
    const headRow = Array.from(head.children).find(i => i.nodeName === 'TR')
    const ths = Array.from(headRow.children).filter(i => i.nodeName === 'TH')
    const colNames = ths.map(() => Id.getStrId())
    tableEle.columns = ths.map((i, idx) => ({
      accessor: colNames[idx],
      width: 150
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
    return null
  }
  const body = node.querySelector('tbody')
  if (body) {
    const bodyRows = Array.from(body.children).filter(i => i.nodeName === 'TR')
    bodyRows.forEach(row => {
      const tds = Array.from(row.children).filter(i => i.nodeName === 'TD')
      const normalizedRow: TableRowElement = {
        type: 'tableRow',
        id: Id.getId(),
        children: tableEle.columns.map((i, idx) => ({
          type: 'tableCell',
          colName: i.accessor,
          children: [
            {
              type: 'paragraph',
              id: Id.getId(),
              children: [{ text: tds[idx]?.innerText || tds[idx]?.textContent || '' }]
            }
          ]
        }))
      }
      tableEle.children.push(normalizedRow)
    })
  }
  console.log(tableEle, node)
  return tableEle
}
