import { RenderElementProps } from 'slate-react'
import NoteMedia from './NoteMedia'
import PdfMedia from './PdfMedia'

const Media = ({ element, children }: RenderElementProps) => {
  if (element.type === 'pdf') {
    return <PdfMedia element={element} children={children} />
  }
  if (element.type === 'note') {
    return <NoteMedia element={element} children={children} />
  }
  return null
}

export default Media
