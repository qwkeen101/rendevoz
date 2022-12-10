import { Content } from '@/components'
import { EditorV1 } from '@/components/editor/Editor'
import EditorManager from '@/components/editor/EditorManager'
import { FC } from 'react'

const EditorPage: FC<{
  noteId: number
  id: string
}> = ({ noteId, id }) => {
  // const [searchParams] = useSearchParams()
  // const documentId = searchParams.get('documentId')

  return (
    <Content
      fullHeight
      fullWidth
      flex
      centered
      style={{
        paddingTop: 50
      }}
    >
      <EditorV1 id={id} noteId={noteId} />
    </Content>
  )
}

export default EditorPage
