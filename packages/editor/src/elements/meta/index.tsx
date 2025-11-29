import { FC, memo } from 'react'
import { RenderElementProps } from 'slate-react'
import { ObjectActionMenu } from '@/core'
import { IconWithPopover, WithBorder } from '@/components'
import { Icons } from '@/consts'
import LabelDetailsRenderer from '@/core/object/renderer/LabelDetailsRenderer'
import UncontrolledGroup from '@/core/components/group/UncontrolledGroup'
import Audio from '@/core/components/media/wrappers/Audio'
import Video from '@/core/components/media/wrappers/Video'
import { MetaStore, ObjectStore } from '@/api/stores'
import { IImage } from '~/typings'
import ResizeWrapper from '../elements/ResizeWrapper'
import useEditorInstance from '../hooks/useEditorInstance'
import trans from '@/consts/trans'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { MetaObjectElement } from '~/typings/components/editor/outerElements'

const MetaObject: FC<RenderElementProps> = memo(({ children, element }) => {
  const instance = useEditorInstance()
  const metaEle = element as MetaObjectElement
  const { t } = useTranslation()
  const { originId } = metaEle
  const metaObject = MetaStore.useValue(originId)
  const target = ObjectStore(metaObject?.type).useValue(metaObject?.objectId)
  if (!metaObject) return null
  if (instance.values.displayMode) {
    return (
      <div>
        <p>{metaObject?.name || metaObject?.placeholderName}</p>
        {children}
      </div>
    )
  }
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
              padding: 'var(--editor-scroll-padding)'
            }
          }}
          groupId={metaObject.objectId}
        />
      )
    }
  }
  if (element.cardType === 'embeded') {
    return (
      <div contentEditable={'false'} style={{ position: 'relative' }}>
        {renderExpanded()}
        {children}
      </div>
    )
  }
  const renderLineMain = () => (
    <div
      onClick={() => {
        Global.layoutOps?.openObject(originId)
      }}
      className={'w-full em:min-h-24 button !p-0 bg-third rounded-md items-stretch overflow-hidden flex'}
      style={{
        flexWrap: 'wrap-reverse'
      }}
    >
      <div
        className={'em:p-6 overflow-hidden relative gap-1 flex flex-col justify-center'}
        style={{
          flex: '4 1 160px'
        }}
      >
        <div className={classnames('font-semibold pr-6 w-full', !metaObject.name && 'transparent-font')}>
          {metaObject.name || t(trans.Unnamed)}
        </div>
        <div className={'transparent-font text-[0.85em]'}>{Global.utils.getTypeName(metaObject.type)}</div>
        <IconWithPopover
          className={'hover-active-button em:text-xl'}
          size={null}
          onClick={e => e.stopPropagation()}
          containerClassName={'absolute right-4 top-4'}
          name={Icons.More}
          content={setV => (
            <WithBorder onClick={e => e.stopPropagation()}>
              <ObjectActionMenu metaObjectId={originId} onClose={() => setV(false)} />
            </WithBorder>
          )}
          align={'start'}
          placement={['right', 'left']}
        />
      </div>
      {metaObject?.coverImgSrc && (
        <div
          style={{
            flex: '1 1 160px',
            position: 'relative'
          }}
        >
          <img
            src={metaObject.coverImgSrc}
            style={{
              position: 'absolute',
              top: '50%',
              borderRadius: 0,
              objectFit: 'cover',
              transform: 'translateY(-50%)'
            }}
          ></img>
        </div>
      )}
    </div>
  )
  if (metaObject?.type?.includes('Label')) {
    return (
      <>
        <LabelDetailsRenderer
          showAudio
          disableSidebar
          imageStyle={{ objectFit: 'contain' }}
          style={{
            border: '1px solid var(--border-background)',
            borderRadius: 8,
            fontSize: '0.92em'
          }}
          metaId={metaObject.id}
        />
        {children}
      </>
    )
  }
  return (
    <>
      {renderLineMain()}
      {children}
    </>
  )
})

export default MetaObject
