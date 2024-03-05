import { createContext } from 'react'
import { RenderElementProps } from '../../slate-react'

export const TableCellContext = createContext<
  | {
      onCellEnter: () => void
      onCellLeave: () => void
    }
  | undefined
>(undefined)
const TableRow = ({ element, children, attributes }: RenderElementProps) => {
  return (
    <tr {...attributes} style={{ position: 'relative' }}>
      {children}
    </tr>
  )
}

export default TableRow
