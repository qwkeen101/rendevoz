import { Content } from '@/components'
import { EditorV1 } from '@/components/editor/Editor'
import { EditorScope } from '@/jotai/jotaiScope'
import { Provider } from 'jotai'
import { FC, useEffect } from 'react'

const EditorPage: FC<{
  noteId: number
  id: string
}> = ({ noteId, id }) => {
  useEffect(() => {
    console.log('mount editor')
    return () => {
      console.log('unmount editor')
    }
  }, [])
  return (
    <Content fullHeight fullWidth flex centered>
      <Provider scope={EditorScope}>
        <EditorV1 id={id} noteId={noteId} />
      </Provider>
    </Content>
  )
}

export default EditorPage
