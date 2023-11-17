import { FC, memo } from 'react'
import { RenderElementProps } from 'slate-react'

const Paragraph: FC<RenderElementProps> = memo(({ children }) => {
  return <p style={{ padding: '0px 2px' }}>{children}</p>
})

export default Paragraph
