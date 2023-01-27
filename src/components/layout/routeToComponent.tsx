import EditorPage from '@/scenes/editor'
import { HomePage } from '@/scenes/home'
import PdfPage from '@/scenes/pdf'
import Id from '@/utils/id'
import { ReactNode } from 'react'
import { Content } from '../base'
import Collection from '../collection'
import IFrame from '../iframe'
import KnowledgeDatabase from '../knowledgeDatabase'
import TabTitle from './TabTitle'

const routeToComponent = (route: string, search?: string): ReactNode | undefined => {
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
  if (route.startsWith('/database')) {
    return (
      <>
        <TabTitle title="Database" />
        <KnowledgeDatabase />
      </>
    )
  }
  if (route.startsWith('/collection')) {
    return (
      <>
        <TabTitle title="Collection" />
        <Content fullHeight fullWidth flex centered style={{ padding: '25px 40px' }}>
          <Collection />
        </Content>
      </>
    )
  }
  if (route.startsWith('/iframe')) {
    const url = route.substring(8) + search
    return (
      <>
        <TabTitle title="frame" />
        <IFrame src={url} />
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
