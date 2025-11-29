import { MetaStore, ObjectStore } from '@/api/stores'
import { IWebpage } from '~/typings'
import LabelDetailsRenderer from '@/core/object/renderer/LabelDetailsRenderer'
import NoteContentDisplayer from '@/core/object/renderer/contentDisplayer/Note'
import WhiteboardDisplayer from '@/core/object/renderer/contentDisplayer/Whiteboard'
import QuestionDisplayer from '@/core/object/renderer/contentDisplayer/Question'
import CodeDisplayer from '@/core/object/renderer/contentDisplayer/Code'
import Tweet from '@/core/components/tweet'
import { CSSProperties, useMemo } from 'react'
import Group from '@/core/object/renderer/contentDisplayer/Group'
import PDFDisplayer from '@/core/object/renderer/contentDisplayer/PDF'
import { Content, Icon } from '@/components'
import MessageContentDisplayer from '@/core/object/renderer/contentDisplayer/Message'
import ChatContentDisplayer from '@/core/object/renderer/contentDisplayer/Chat'
import PageConfigContext from '@/core/components/PageConfigContext'
import Exam from '@/core/object/renderer/contentDisplayer/Exam'
import ExamQuestion from '@/core/object/renderer/contentDisplayer/ExamQuestion'

const tweetStyles = {
  bodyFontSize: '13px',
  border: 'transparent',
  titleFontSize: '13px',
  imageSize: 40,
  infoFontSize: '13px',
  bodyStyles: {
    width: '100%'
  }
}
const config = { isInContentDisplayer: true }
export default ({
  metaId,
  className,
  imageFit = 'cover',
  containerStyle,
  tabIndex,
  mode = 'cover',
  scrollableNote = false
}: {
  metaId: number
  className?: string
  tabIndex?: number
  mode?: 'content' | 'cover'
  imageFit?: 'cover' | 'contain'
  scrollableNote?: boolean
  containerStyle?: CSSProperties
}) => {
  const meta = MetaStore.useValue(metaId)
  const obj = ObjectStore(meta.type).useValue(meta?.objectId)
  const syncMetaValue = useMemo(() => [{ type: 'synced', originId: metaId, id: 1, children: [{ text: '' }], syncVersion: 0 }], [metaId])
  let id: number | undefined = undefined
  if (obj && 'specType' in obj) {
    id = obj.id
    if (obj.specType === 'webpage') {
      id = (obj as IWebpage).noteId
    }
  }
  const hasContent =
    id &&
    meta &&
    ([
      'pdfLabel',
      'noteLabel',
      'webpageLabel',
      'audioLabel',
      'videoLabel',
      'note',
      'webpage',
      'whiteboard',
      'question',
      'code',
      'syncedBlock',
      'tweet',
      'group',
      'message',
      'chat',
      'exam',
      'examQuestion'
    ].includes(meta.type) ||
      (mode === 'content' && ['pdf'].includes(meta.type)))
  const renderContent = () => (
    <>
      {meta?.type && ['pdfLabel', 'noteLabel', 'webpageLabel', 'audioLabel', 'videoLabel'].includes(meta.type) && (
        <LabelDetailsRenderer
          disableSidebar
          collapseOriginalText
          showQuestion={false}
          imageStyle={{
            height: 160,
            flexShrink: 0,
            borderBottom: '1px solid var(--border-background)'
          }}
          showAudio={mode === 'content'}
          sourceStyle={d => ({
            fontSize: 12,
            padding: 6
          })}
          style={{
            fontSize: 12
          }}
          noteStyle={{
            padding: '0px 6px 6px'
          }}
          textStyle={{
            padding: '4px 6px'
          }}
          showAddNote={false}
          showVideo={false}
          metaId={metaId}
        />
      )}
      {(meta?.type === 'note' || meta?.type === 'webpage') && <NoteContentDisplayer scrollable={scrollableNote} id={id} />}
      {meta?.type === 'whiteboard' && <WhiteboardDisplayer id={id} />}
      {meta?.type === 'question' && <QuestionDisplayer id={id} />}
      {meta?.type === 'code' && <CodeDisplayer scrollable={scrollableNote} id={id} />}
      {meta?.type === 'tweet' && <Tweet styles={tweetStyles} id={id} />}
      {meta?.type === 'pdf' && <PDFDisplayer id={id} />}
      {meta?.type === 'group' && <Group id={id} />}
      {meta?.type === 'message' && <MessageContentDisplayer id={id} />}
      {meta?.type === 'chat' && <ChatContentDisplayer id={id} />}
      {meta?.type === 'exam' && <Exam id={id} />}
      {meta?.type === 'examQuestion' && <ExamQuestion id={id} />}
      {meta?.type === 'syncedBlock' && <NoteContentDisplayer scrollable={scrollableNote} value={syncMetaValue} />}
    </>
  )
  const renderIcon = () => {
    const icon = Global.utils.getIcon(meta?.type)
    if (icon) {
      return (
        <Content flex centered fullHeight fullWidth>
          <Icon name={icon} size={36} />
        </Content>
      )
    }
    return null
  }
  return (
    (id || meta?.coverImgSrc) && (
      <PageConfigContext.Provider value={config}>
        <div tabIndex={tabIndex} style={containerStyle} className={className}>
          {mode === 'content' &&
            (hasContent ? (
              renderContent()
            ) : meta?.coverImgSrc ? (
              <img
                src={meta.coverImgSrc}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: imageFit
                }}
              />
            ) : (
              renderIcon()
            ))}
          {mode === 'cover' &&
            (meta?.coverImgSrc && !meta.type.includes('Label') ? (
              <img
                src={meta.coverImgSrc}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: imageFit
                }}
              />
            ) : hasContent ? (
              renderContent()
            ) : (
              renderIcon()
            ))}
        </div>
      </PageConfigContext.Provider>
    )
  )
}
