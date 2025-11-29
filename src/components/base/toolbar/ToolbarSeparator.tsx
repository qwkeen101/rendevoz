import { CSSProperties, FC } from 'react'
import { Colors } from '@/consts'

interface ToolbarSeparatorProps {
  direction?: 'vertical' | 'horizontal'
  style?: CSSProperties
}

const ToolbarSeparator: FC<ToolbarSeparatorProps> = ({ direction, style }) => {
  const verticalSeparator: CSSProperties = {
    width: '1px',
    height: '20px',
    margin: 'auto 4px',
    background: Colors.Background.Border,
    ...style,
    padding: undefined
  }
  const horizontalSeparator: CSSProperties = {
    borderRight: `1px solid ${Colors.Background.Border}`,
    ...style
  }
  return <div style={direction === 'horizontal' ? verticalSeparator : horizontalSeparator}></div>
}

export default ToolbarSeparator
