import Id from '@/utils/id'
import { useMemo } from 'react'
import { Editor, EditorProps } from './Editor'

type IWebpageEditor = {} & EditorProps
const WebpageEditor = ({
  initialValue,
  title,
  onLinkClick,
  noteId,
  onEditorInstanceInitialized,
  onHighlight,
  onHighlightDrag,
  readonly = true
}: // readonly = true
IWebpageEditor) => {
  const id = useMemo(() => Id.getStrId(), [])
  return (
    <Editor
      titleContainerStyle={{
        width: 800,
        padding: '20px 0px',
        maxWidth: 'calc(100% - 100px)'
      }}
      readonly={readonly}
      showToolbar
      onHighlight={onHighlight}
      onHighlightDrag={onHighlightDrag}
      id={id}
      titleEditable={false}
      initialValue={initialValue}
      onEditorInstanceInitialized={onEditorInstanceInitialized}
      noteId={noteId}
      title={title}
      onLinkClick={onLinkClick}
    />
  )
}

export default WebpageEditor
