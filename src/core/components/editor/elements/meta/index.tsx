import { FC, memo, useState } from 'react'
import { RenderElementProps } from 'slate-react'
import NoteCard from '../cards/NoteCard'
import { useRenderObject } from '@/core'
import { Content } from '@/components'
import { Colors } from '@/consts'
import FontSize from '@/consts/font'
import LabelDetailsRenderer from '@/core/object/renderer/LabelDetailsRenderer'
import UncontrolledGroup from '@/core/components/group/UncontrolledGroup'
import Audio from '@/core/components/media/wrappers/Audio'
import Video from '@/core/components/media/wrappers/Video'
import Image from '@/core/components/editor/elements/image'
import { ObjectStore } from '@/api/stores'
import { IImage } from '~/typings'
import ResizeWrapper from '@/core/components/editor/elements/ResizeWrapper'

const MetaObject: FC<RenderElementProps> = memo(({ children, element }) => {
  const metaEle = element
  const { originId } = metaEle

  const { renderWhole, metaObject } = useRenderObject({
    metaObjectId: originId
  })
  const target = ObjectStore(metaObject?.type).useValue(metaObject?.objectId)
  const renderExpanded = () => {
    if (!metaObject) return <div>Deleted content</div>
    if (metaObject.type === 'image') {
      return (
        <ResizeWrapper minWidth={'50%'} enable={{ left: true, right: true }} style={{ margin: 'auto' }} element={element}>
          <img
            src={(target as IImage)?.url}
            style={{
              width: '100%',
              objectFit: 'cover'
            }}
          />
        </ResizeWrapper>
      )
    }
    if (metaObject.type === 'audio') {
      return (
        <div className={'border'} style={{ padding: '12px 16px 0px', borderRadius: 8 }}>
          <Audio
            mediaState={{
              layout: {
                showAudioThumbnail: false
              },
              styles: {
                titleStyle: {
                  fontSize: 15,
                  marginBottom: 6
                },
                descriptionStyle: {
                  fontSize: 13
                },
                descriptionEllispsis: 0
              }
            }}
            audioId={metaObject.objectId}
            onlyCore
          />
        </div>
      )
    }
    if (metaObject.type === 'video') {
      return (
        <div>
          <Video videoId={metaObject.objectId} onlyCore />
        </div>
      )
    }
    if (metaObject.type === 'group') {
      return (
        <UncontrolledGroup
          layout={{
            showTitle: false,
            showTitleActions: false
          }}
          state={{
            onlyOpenIn: 'center'
          }}
          styles={{
            pagePaddingLeft: 0,
            bottomPadding: 0,
            actionPaddingTop: 0,
            containerClassName: 'selectable',
            containerStyle: {
              overflow: 'auto hidden',
              padding: 0
            }
          }}
          groupId={metaObject.objectId}
        />
      )
    }
  }
  if (element.cardType === 'embeded') {
    return (
      <div
        contentEditable={'false'}
        style={{ position: 'relative', padding: metaObject?.type === 'group' ? 'var(--editor-scroll-padding)' : undefined }}
      >
        {renderExpanded()}
        {children}
      </div>
    )
  }
  const renderLineMain = () => (
    <Content
      flex
      style={{
        flexWrap: 'wrap-reverse',
        width: '100%',
        borderRadius: 6,
        alignItems: 'stretch',
        overflow: 'hidden',
        border: `1px solid ${Colors.Background.Border}`
      }}
    >
      <div
        style={{
          flex: '4 1 180px',
          overflow: 'hidden',
          padding: '12px 14px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {renderWhole({
          optionOptions: {
            style: {
              top: -5,
              right: 0
            },
            renderOnParent: false
          },
          columnGap: 4,
          titleOptions: {
            style: {
              fontSize: 15
            },
            ellipsisLine: 0
          },
          descriptionOptions: {
            style: {
              fontSize: FontSize['12px']
            }
          },
          renderOptions: {
            renderFrom: true,
            renderImage: false,
            renderOption: true
          }
        })}
      </div>
      {metaObject?.coverImgSrc && (
        <div
          style={{
            flex: '1 1 180px',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0
            }}
          >
            <img
              style={{
                objectFit: 'cover',
                borderRadius: 1,
                width: '100%',
                height: '100%'
              }}
              src={metaObject.coverImgSrc}
            />
          </div>
        </div>
      )}
    </Content>
  )
  if (metaObject?.type?.includes('Label')) {
    return (
      <>
        {children}
        <LabelDetailsRenderer
          style={{
            border: '1px solid var(--border-background)',
            borderRadius: 8
          }}
          metaId={metaObject.id}
        />
      </>
    )
  }
  return (
    <NoteCard
      pictureUrl={metaObject?.coverImgSrc}
      // main={metaEle?.cardType === 'line' || metaEle?.cardType === undefined ? renderLineMain() : renderMain()}
      main={renderLineMain()}
      element={{ ...element, noteId: metaObject?.noteId }}
      children={children}
    />
  )
})

export default MetaObject
