import { useCallback } from 'react'
import { createEditor, Descendant } from 'slate'
import { Element, Leaf } from '../InnerEditor'
import { Editable, RenderElementProps, RenderLeafProps, Slate, withReact } from '../slate-react'

const ReadonlyEditor = ({ value }: { value: Descendant[] }) => {
  const editor = withReact(createEditor())
  editor.readonly = true
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
  return (
    <Slate editor={editor} value={value}>
      <Editable readOnly renderElement={renderElement} renderLeaf={renderLeaf} />
    </Slate>
  )
}

export default ReadonlyEditor
