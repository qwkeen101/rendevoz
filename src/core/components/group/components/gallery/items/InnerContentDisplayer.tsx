import { MetaStore, ObjectStore } from '@/api/stores'
import { IWebpage } from '~/typings'
import LabelDetailsRenderer from '@/core/object/renderer/LabelDetailsRenderer'
import NoteContentDisplayer from '@/core/object/renderer/contentDisplayer/Note'
import WhiteboardDisplayer from '@/core/object/renderer/contentDisplayer/Whiteboard'
import QuestionDisplayer from '@/core/object/renderer/contentDisplayer/Question'
import CodeDisplayer from '@/core/object/renderer/contentDisplayer/Code'
import Tweet from '@/core/components/tweet'
import { CSSProperties } from 'react'
import Group from '@/core/object/renderer/contentDisplayer/Group'
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
export default ({
  metaId,
  className,
  labelMaxHeight = true,
  imageFit = 'cover',
  containerStyle,
  tabIndex
}: {
  metaId: number
  className?: string
  tabIndex?: number
  imageFit?: 'cover' | 'contain'
  containerStyle?: CSSProperties
  labelMaxHeight?: boolean
}) => {
  const meta = MetaStore.useValue(metaId)
  const obj = ObjectStore(meta.type).useValue(meta?.objectId)
  let id: number | undefined = undefined
  if (obj && 'specType' in obj) {
    id = obj.id
    if (obj.specType === 'webpage') {
      id = (obj as IWebpage).noteId
    }
  }
  return (
    (id || meta?.coverImgSrc) && (
      <div tabIndex={tabIndex} style={containerStyle} className={className}>
        {id &&
        meta &&
        [
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
          'tweet',
          'group'
        ].includes(meta.type) ? (
          <>
            {meta?.type && ['pdfLabel', 'noteLabel', 'webpageLabel', 'audioLabel', 'videoLabel'].includes(meta.type) && (
              <LabelDetailsRenderer
                imageStyle={
                  labelMaxHeight
                    ? m => ({
                        maxHeight: m?.name ? 150 : 172
                      })
                    : undefined
                }
                sourceStyle={{
                  padding: meta?.name ? '6px 8px' : '7px 8px'
                }}
                style={{
                  fontSize: 12
                }}
                noteStyle={{
                  padding: '0px 8px'
                }}
                showAddNote={false}
                showVideo={false}
                metaId={metaId}
              />
            )}
            {(meta?.type === 'note' || meta?.type === 'webpage') && <NoteContentDisplayer id={id} />}
            {meta?.type === 'whiteboard' && <WhiteboardDisplayer id={id} />}
            {meta?.type === 'question' && <QuestionDisplayer id={id} />}
            {meta?.type === 'code' && <CodeDisplayer id={id} />}
            {meta?.type === 'tweet' && <Tweet styles={tweetStyles} id={id} />}
            {meta?.type === 'group' && <Group id={id} />}
          </>
        ) : meta?.coverImgSrc ? (
          <img
            src={meta.coverImgSrc}
            style={{
              width: '100%',
              height: '100%',
              objectFit: imageFit
            }}
          />
        ) : null}
      </div>
    )
  )
}
