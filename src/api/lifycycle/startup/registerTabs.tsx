import { ILayoutTab, TabData } from '~/typings'
import Id from '@/utils/id'
import Webpage from '@/core/components/webpage/Webpage'
import { ObjectTimeline } from '@/core'
import SyncedBlockPage from '@/scenes/SyncedBlockPage'
import { EditorPage, HomePage, PdfPage, WhiteboardPage, ImagePage, VideoPage, GraphPage, MetaGroupPage, DatabasePage } from '@/scenes'
import { Rendevoz } from '@/core/rendevoz'
import FeedViewer from '@/core/components/feed'
import AudioPage from '@/scenes/AudioPage'
import QuestionPage from '@/scenes/QuestionPage'
import CodePage from '@/scenes/CodePage'
import LabelDetailsRenderer from '@/core/object/renderer/LabelDetailsRenderer'

export const RENDEVOZ_DEFAULT_TABS: TabData[ILayoutTab['type']][] = [
  {
    type: 'note',
    content: opts =>
      opts.objectId && (
        <EditorPage type="note" noteId={opts.objectId} id={Id.getStrId()} onInstanceInitialized={opts.onInstanceInitialized} />
      )
  },
  {
    type: 'syncedBlock',
    content: opts => opts.objectId && <SyncedBlockPage id={opts.objectId} />
  },
  {
    type: 'image',
    content: opts => opts.objectId && <ImagePage imageId={opts.objectId} />
  },
  {
    type: 'code',
    content: opts => opts.objectId && <CodePage id={opts.objectId} />
  },
  {
    type: 'pdf',
    content: opts => opts.objectId && <PdfPage pdfId={opts.objectId} onInstanceInitialized={opts.onInstanceInitialized} />
  },
  {
    type: 'video',
    content: opts => opts.objectId && <VideoPage videoId={opts.objectId} onInstanceInitialized={opts.onInstanceInitialized} />
  },
  {
    type: 'question',
    content: opts => opts.objectId && <QuestionPage id={opts.objectId} />
  },
  {
    type: 'audio',
    content: opts => opts.objectId && <AudioPage audioId={opts.objectId} onInstanceInitialized={opts.onInstanceInitialized} />
  },
  {
    type: 'webpage',
    content: opts => opts.objectId && <Webpage initialWebpageId={opts.objectId} onInstanceInitialized={opts.onInstanceInitialized} />
  },
  {
    type: 'whiteboard',
    content: opts => opts.objectId && <WhiteboardPage whiteboardId={opts.objectId} onInstanceInitialized={opts.onInstanceInitialized} />
  },
  {
    type: 'home',
    content: () => <HomePage />
  },
  {
    type: 'database',
    content: () => <DatabasePage />
  },
  {
    type: 'graph',
    content: () => <GraphPage />
  },
  {
    type: 'review',
    content: () => <ReviewManager />
  },
  {
    type: 'timeline',
    content: () => <ObjectTimeline />
  },
  {
    type: 'group',
    content: opts => <MetaGroupPage groupId={opts.objectId} />
  },
  {
    type: 'synced',
    content: opts => <SyncedBlockPage metaId={opts.objectId} />
  },
  {
    type: 'feeds',
    content: opts => <FeedViewer />
  }
]

const labels = ['pdfLabel', 'webpageLabel', 'noteLabel', 'videoLabel', 'audioLabel']

labels.forEach(l => {
  RENDEVOZ_DEFAULT_TABS.push({
    type: l,
    content: opts => opts.metaId && <LabelDetailsRenderer metaId={opts.metaId} />
  })
})
const registerTabs = () => {
  RENDEVOZ_DEFAULT_TABS.forEach(i => Rendevoz.Actions.Layout.registerTabData(i))
}

export default registerTabs
