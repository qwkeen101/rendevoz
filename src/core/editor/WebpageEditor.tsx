import Id from '@/utils/id'
import { useMemo } from 'react'
import { EditorProps } from './Editor'
import EditorPage from '@/scenes/editor'

type IWebpageEditor = EditorProps
const WebpageEditor = ({ initialValue, title, noteId, on, showToolbar, onInstanceIntialized, readonly = true }: IWebpageEditor) => {
  const id = useMemo(() => Id.getStrId(), [])
  return (
    <EditorPage
      disableTitle
      titleContainerStyle={{
        width: 800,
        padding: '20px 0px',
        maxWidth: 'calc(100% - 100px)'
      }}
      on={on}
      readonly={readonly}
      showToolbar={showToolbar}
      id={id}
      titleEditable={false}
      onInstanceInitialized={onInstanceIntialized}
      initialValue={initialValue}
      noteId={noteId}
      title={title}
    />
  )
}

export default WebpageEditor
