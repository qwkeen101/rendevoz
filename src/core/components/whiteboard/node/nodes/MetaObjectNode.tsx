import { IWhiteboardNode } from '~/typings/data'
import { Content } from '@/components/base'
import { FC, memo, useEffect, useMemo, useRef } from 'react'
import { InnerNodeProps } from '../WrapperNode'
import PdfNode from './PdfNode'
import NoteNode from './NoteNode'
import { useRenderObject } from '@/core'
import WebpageNode from '@/core/components/whiteboard/node/nodes/WebpageNode'
import SyncedBlockNode from '@/core/components/whiteboard/node/nodes/SyncedBlockNode'
import Video from '@/core/components/media/wrappers/Video'
import Audio from '@/core/components/media/wrappers/Audio'
import { MetaGroupPage } from '@/scenes'
import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'
import Code from '@/core/components/code'
import { css } from '@emotion/css'
import LabelDetailsRenderer from '@/core/object/renderer/LabelDetailsRenderer'
import WhiteboardNode from '@/core/components/whiteboard/node/nodes/WhiteboardNode'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import { Icon } from '@/components'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import QuestionCard from '@/core/ai/components/question/QuestionCard'
import Tweet from '@/core/components/tweet'
import { Colors } from '@/consts'

const MetaObjectNode: FC<InnerNodeProps> = ({ node: n, setNodeState, nodeState }) => {
  const node = n as IWhiteboardNode & { type: 'metaObject' }
  const { expanded } = node
  const { metaObjectId } = node

  const { metaObject } = useRenderObject({
    metaObjectId: metaObjectId!
  })

  const imageRef = useRef<HTMLImageElement>(null)
  const wholeContainerRef = useRef<HTMLDivElement>(null)
  const hasImage = !!metaObject?.coverImgSrc

  useEffect(() => {
    if (hasImage) {
      setNodeState?.(s => ({ ...s, keepRatioResize: true }))
    } else {
      setNodeState?.(s => ({ ...s, keepRatioResize: false }))
    }
  }, [hasImage])

  const hasImageRenderer = () =>
    metaObject && (
      <Content fullWidth flex column style={{ width: 500, minHeight: '100%', maxHeight: '100%', minWidth: '100%', maxWidth: '100%' }}>
        <img
          draggable={'false'}
          ref={imageRef}
          src={metaObject?.coverImgSrc}
          style={{
            position: 'relative',
            width: '100%',
            objectFit: 'cover',
            flex: 1,
            overflow: 'hidden',
            borderRadius: '8px 8px 0px 0px'
          }}
        />
        <div
          ref={wholeContainerRef}
          style={{
            padding: '8px',
            width: '100%',
            height: 'auto',
            position: 'absolute',
            bottom: 0,
            left: 0,
            display: 'flex',
            gap: 6,
            paddingRight: 24
          }}
        >
          <div
            className={ClassName.ellipsisFont(1)}
            style={{
              padding: '1px 6px',
              borderRadius: 4,
              fontSize: 12,
              // lineHeight: 1,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              flexShrink: 1
            }}
          >
            {metaObject?.name || metaObject?.placeholderName}
          </div>
          <div
            style={{
              padding: '1px 6px',
              borderRadius: 4,
              fontSize: 12,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              flexShrink: 0
            }}
          >
            {Rendevoz.Utils.Meta.getTypeName(metaObject.type)}
          </div>
        </div>
      </Content>
    )

  const renderExpanded = () => {
    if (metaObject?.objectId) {
      switch (metaObject?.type) {
        case 'pdf':
          return (
            <PdfNode
              node={{
                documentId: metaObject.objectId
              }}
            />
          )
        case 'group': {
          return (
            <div style={{ width: '1000px', maxWidth: '100%', minWidth: '100%', minHeight: '100%', maxHeight: '100%' }}>
              <MetaGroupPage groupId={metaObject.objectId} />
            </div>
          )
        }
        case 'audio': {
          return (
            <div
              style={{
                width: '1000px',
                maxWidth: '100%',
                minWidth: '100%',
                padding: 30,
                minHeight: '100%',
                maxHeight: '100%'
              }}
            >
              <Audio onlyCore={true} audioId={metaObject.objectId} />
            </div>
          )
        }
        case 'webpage':
          return <WebpageNode node={node} webpageId={metaObject.objectId} />
        case 'video':
          return (
            <div style={{ width: '800px', maxWidth: '100%', minWidth: '100%', minHeight: '100%', maxHeight: '100%' }}>
              <Video onlyCore={true} videoId={metaObject.objectId} />
            </div>
          )
        case 'note': {
          return (
            <NoteNode
              nodeState={nodeState}
              node={{
                ...node,
                noteId: metaObject.objectId
              }}
              metaId={metaObject.id}
            />
          )
        }
        case 'code':
          return (
            <div style={{ width: '800px', maxWidth: '100%', minWidth: '100%', minHeight: '100%', maxHeight: '100%' }}>
              <Code id={metaObject.objectId} />
            </div>
          )
        case 'tweet':
          return <Tweet id={metaObject.objectId} layout={{ showBorder: false }} />
        case 'question':
          return (
            <QuestionCard
              containerStyle={{
                maxWidth: '100%',
                minWidth: '100%',
                minHeight: '100%',
                maxHeight: '100%',
                padding: 24
              }}
              id={metaObject.objectId}
              display={{
                from: true,
                pointers: true
              }}
            />
          )
        case 'whiteboard':
          return <WhiteboardNode metaId={metaObjectId} />
        case 'syncedBlock':
          return <SyncedBlockNode node={node} />
        default: {
          return hasImage ? hasImageRenderer() : titleRenderer()
        }
      }
    }
  }
  const instance = useWhiteboardInstance()
  if (metaObject?.type.includes('Label')) {
    return <LabelDetailsRenderer autoPlay showVideo={nodeState?.focused} metaId={metaObjectId} />
  }

  const titleRenderer = () => {
    if (!metaObject) return null
    return (
      <Content alignItems={'center'} flex gap={12} style={{ width: '100%', padding: '14px' }}>
        {instance.nodeOps?.canExpand(node) && (
          <Icon
            size={18}
            name={'park-right'}
            className={ClassName.flatButton(4, '3px')}
            onClick={() => {
              instance.nodeOps?.expand(node.id)
            }}
            style={{
              opacity: nodeState?.focused ? 1 : 0
            }}
          />
        )}
        <Content alignItems={'center'} flex gap={16} justifyContent={'center'} style={{ width: '100%', fontSize: 17 }}>
          <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon(metaObject.type)} />
          <div
            style={{
              fontWeight: 600
            }}
            className={ClassName.ellipsisFont(1)}
          >
            {metaObject.name || metaObject.placeholderName}
          </div>
        </Content>
        <Icon
          onClick={() => {
            instance.nodeOps?.open(node.id, 'sidePeek')
          }}
          size={18}
          name={'custom-right-bar'}
          className={ClassName.flatButton(4, '3px')}
          style={{
            opacity: nodeState?.focused ? 1 : 0
          }}
        />
      </Content>
    )
  }
  if (!metaObject || metaObject.deleted) {
    return (
      <div
        className={'transparent-font'}
        style={{
          width: node.width,
          height: node.height,
          border: Colors.Consts.Border,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        Deleted object
      </div>
    )
  }
  return expanded ? (
    <DockTabPaneContext.Provider value={{ currentTabId: '' }}>{renderExpanded()}</DockTabPaneContext.Provider>
  ) : hasImage ? (
    hasImageRenderer()
  ) : (
    titleRenderer()
  )
}

export default memo(MetaObjectNode)
