import EditorPage from '@/scenes/editor'
import Graph from '@/scenes/graph'
import { HomePage } from '@/scenes/home'
import PdfPage from '@/scenes/pdf'
import Id from '@/utils/id'
import { ReactNode } from 'react'
import { Content } from '../base'
import Collection from '../collection'
import TabTitle from './TabTitle'

const routeToComponent = (route: string): ReactNode | undefined => {
  if (route.startsWith('/editor')) {
    const noteId = route.split('/')[2]
    const id = Id.getStrId()
    if (noteId) {
      return <EditorPage id={id} noteId={Number(noteId)} />
    }
  }
  if (route.startsWith('/pdf')) {
    const id = route.split('/')[2]
    if (id) {
      return <PdfPage pdfId={Number(id)} />
    }
  }
  if (route.startsWith('/graph')) {
    return (
      <>
        <TabTitle title="Graph" />
        <Graph />
      </>
    )
  }
  if (route.startsWith('/collection')) {
    return (
      <>
        <TabTitle title="Collection" />
        <Content fullHeight fullWidth flex centered style={{padding: '25px 40px'}}>
          <Collection />
        </Content>
      </>
    )
  }
  if (route.startsWith('/') || route.startsWith('/home')) {
    return (
      <>
        <TabTitle title="Home" />
        <HomePage />
      </>
    )
  }
}

export default routeToComponent
