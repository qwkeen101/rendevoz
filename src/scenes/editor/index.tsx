import { Content } from '@/components'
import { EditorV1 } from '@/components/editor/Editor'
import EditorManager from '@/components/editor/EditorManager'
import { useParams, useSearchParams } from 'react-router-dom'

const EditorPage = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const documentId = searchParams.get('documentId')

  return (
    <Content style={{ width: '100%', height: '100%',paddingLeft: 50 }} flex centered>
      <Content fullHeight fullWidth flex centered>
        <EditorManager titleMarginTop={50} documentId={parseInt(documentId)} initialNoteId={parseInt(id)} />
      </Content>
    </Content>
  )
}

export default EditorPage
