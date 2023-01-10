import { FC, memo } from 'react'
import { RenderElementProps } from 'slate-react'
const Paragraph: FC<RenderElementProps> = memo(({ children, element }) => {
  return (
    <div
      style={{
        fontSize: element.children[0].text === '' ? element.children[0].fontSize : undefined
      }}
    >
      {children}
    </div>
  )
})
export default Paragraph
