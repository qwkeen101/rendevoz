import Id from '@/utils/id'
import { useMemo } from 'react'
import { Editor, EditorProps } from './Editor'

type IWebpageEditor = {} & EditorProps
const WebpageEditor = ({
  initialValue,
  title,
  onLinkClick,
  noteId,
  onHighlight,
  onHighlightDrag,
  onHighlightRemove,
  onTranslate,
  onEditorInitialized,
  onChange,
  onSearch,
  showToolbar,
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
      showToolbar={showToolbar}
      onHighlight={onHighlight}
      onHighlightDrag={onHighlightDrag}
      onHighlightRemove={onHighlightRemove}
      onTranslate={onTranslate}
      id={id}
      titleEditable={false}
      initialValue={initialValue}
      onEditorInitialized={onEditorInitialized}
      onChange={onChange}
      noteId={noteId}
      onSearch={onSearch}
      title={title}
      onLinkClick={onLinkClick}
    />
  )
}

export default WebpageEditor
