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
import RecycleBin from '@/core/components/recycleBin'
import TypeGroup from '@/core/components/category/type'
import TagGroup from '@/core/components/category/tag'
import TweetPage from '@/scenes/TweetPage'
import CollectionGroup from '@/core/components/category/CollectionGroup'
import { GlobalInstance } from '@/hooks'

export const RENDEVOZ_DEFAULT_TABS: TabData[ILayoutTab['type']][] = [
  {
    type: 'typeGroup',
    content: opts => opts.metaType && <TypeGroup type={opts.metaType} />
  },
  {
    type: 'tweet',
    content: opts => opts.objectId && <TweetPage id={opts.objectId} />
  },
  {
    type: 'tagGroup',
    content: opts => opts.objectId && <TagGroup id={opts.objectId} />
  },
  {
    type: 'collectionGroup',
    content: opts => opts.objectId && <CollectionGroup id={opts.objectId} />
  },
  {
    type: 'note',
    content: opts =>
      opts.objectId && (
        <EditorPage type="note" noteId={opts.objectId} id={Id.getStrId()} onInstanceInitialized={opts.onInstanceInitialized} />
      )
  },
  {
    type: 'recycleBin',
    content: () => <RecycleBin />
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
  RENDEVOZ_DEFAULT_TABS.forEach(i => {
    GlobalInstance.layoutOps?.registerTabData(i)
  })
}

export default registerTabs
