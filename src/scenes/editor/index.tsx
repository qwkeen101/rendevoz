import { Content } from '@/components'
import { Editor } from '@/core'
import { CustomEditor } from '~/typings'
import TabTitle from '@/components/layout/TabTitle'
import { FC, useState } from 'react'

const EditorPage: FC<{
  noteId: number
  id: string
  disableTitle?: boolean
  onTitleChange?: (t: string) => void
  onEditorInitialized?: (editor: CustomEditor) => void
}> = ({ noteId, id, onEditorInitialized, disableTitle, onTitleChange }) => {
  const [title, setTitle] = useState('Untitled')
  return (
    <Content fullHeight fullWidth flex centered>
      {!disableTitle && <TabTitle title={title} icon="park-notes" />}
      <Editor
        id={id}
        noteId={noteId}
        onTitleChange={e => {
          setTitle(e)
          onTitleChange?.(e)
        }}
        onEditorInitialized={onEditorInitialized}
      />
    </Content>
  )
}

export default EditorPage
