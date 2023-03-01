import { Content } from '@/components'
import { Editor } from '@/components/editor/Editor'
import { CustomEditor } from '@/components/editor/types'
import TabTitle from '@/components/layout/TabTitle'
import { FC, useState } from 'react'

const EditorPage: FC<{
  noteId: number
  id: string
  onEditorInitialized?: (editor: CustomEditor) => void
}> = ({ noteId, id, onEditorInitialized }) => {
  const [title, setTitle] = useState('Untitled')
  return (
    <Content fullHeight fullWidth flex centered>
      <TabTitle title={title} />
      <Editor id={id} noteId={noteId} onTitleChange={e => setTitle(e)} onEditorInitialized={onEditorInitialized} />
    </Content>
  )
}

export default EditorPage
