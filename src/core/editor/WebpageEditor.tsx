import Id from '@/utils/id'
import { useMemo } from 'react'
import { EditorProps } from './Editor'
import EditorPage from '@/scenes/editor'

type IWebpageEditor = EditorProps
const WebpageEditor = ({
  initialValue,
  title,
  noteId,
  on,
  showToolbar,
  onInstanceInitialized,
  readonly = true,
  stringTitle,
  defaultReadOnly = true
}: IWebpageEditor) => {
  const id = useMemo(() => Id.getStrId(), [])
  return (
    <EditorPage
      type="webpage"
      disableTitle
      titleContainerStyle={{
        width: 800,
        padding: '20px 0px',
        maxWidth: 'calc(100% - 100px)'
      }}
      on={on}
      defaultReadOnly={true}
      showToolbar={showToolbar}
      id={id}
      titleEditable={false}
      onInstanceInitialized={onInstanceInitialized}
      initialValue={initialValue}
      noteId={noteId}
      title={title}
      stringTitle={stringTitle}
    />
  )
}

export default WebpageEditor
