import { IWhiteboardNode } from '~/typings/data'
import { Content } from '@/components/base'
import ClassName from '@/styles/classNames'
import { FC, memo, useEffect, useMemo, useRef } from 'react'
import { InnerNodeProps } from '../WrapperNode'
import PdfNode from './PdfNode'
import NoteNode from './NoteNode'
import { useRenderObject } from '@/core'
import FontSize from '@/consts/font'
import WebpageNode from '@/core/components/whiteboard/node/nodes/WebpageNode'
import { Rendevoz } from '@/core/rendevoz'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import SyncedBlockNode from '@/core/components/whiteboard/node/nodes/SyncedBlockNode'
import Video from '@/core/components/media/wrappers/Video'
import Audio from '@/core/components/media/wrappers/Audio'
import { MetaGroupPage } from '@/scenes'
import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'
import Code from '@/core/components/code'
import { css } from '@emotion/css'

const tagsClass = css({
  '> *': {
    fontSize: '13px !important',
    lineHeight: '1.5 !important',
    color: 'var(--font-primary)'
  }
})
const MetaObjectNode: FC<InnerNodeProps> = ({ node: n, setNodeState, nodeState }) => {
  const node = n as IWhiteboardNode & { type: 'metaObject' }
  const { expanded } = node
  const { metaObjectId } = node
  const instance = useWhiteboardInstance()
  const { renderWhole, metaObject } = useRenderObject({
    metaObjectId: metaObjectId!
  })

  const hasSize = node.width && node.height
  const imageRef = useRef<HTMLImageElement>(null)
  const wholeContainerRef = useRef<HTMLDivElement>(null)
  const hasImage = metaObject?.coverImgSrc !== undefined
  useEffect(() => {
    if (hasImage) {
      setNodeState?.(s => ({ ...s, keepRatioResize: true }))
    } else {
      setNodeState?.(s => ({ ...s, keepRatioResize: false }))
    }
  }, [hasImage])
  const renderOptions = useMemo(
    () => ({
      renderOptions: {
        renderImage: false,
        renderFrom: true,
        renderDescription: true,
        renderOriginalText: true
      },
      columnGap: 6,
      tagsOptions: {
        gap: 6,
        containerClassName: tagsClass
      },
      titleOptions: {
        style: {
          fontSize: 18,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap'
        },
        originalTextStyle: {
          marginTop: 3,
          fontSize: 14
        },
        showEditBoxShadow: false,
        clickToEdit: metaObject?.type?.includes('Label'),
        showAddNote: nodeState?.focused ? true : false,
        ellipsisLine: 0
      },
      descriptionOptions: {
        style: {
          fontSize: 14
        },
        ellipsisLine: 0
      },
      fromOptions: {
        style: {
          fontSize: 13,
          gap: '0.3rem'
        }
      }
    }),
    [hasSize, hasImage]
  )
  useEffect(() => {
    if (hasImage) {
      const img = imageRef.current
      if (img && node.height) {
        const ratio = img.naturalHeight / img.naturalWidth
        const realHeight = ratio * img.clientWidth
        const currentHeight = img.clientHeight
        const heightOffset = realHeight - currentHeight
        instance.updateNode?.(node.id, n => (n.height ? { ...n, height: n.height + heightOffset } : n), false)
      }
    }
  }, [hasImage])
  const hasImageRenderer = () => (
    <Content fullWidth flex column style={{ width: 500, minHeight: '100%', maxHeight: '100%', minWidth: '100%', maxWidth: '100%' }}>
      <img
        draggable={true}
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
          padding: '16px',
          width: '100%',
          height: 'auto'
        }}
      >
        {renderWhole(renderOptions)}
      </div>
    </Content>
  )
  let width = node.width || 350
  if (!metaObject?.type.includes('Label') && !node.width) {
    width = Math.min(getTextWidth(metaObject?.name || 'Default Name') + 50, 500)
  }

  const commonRenderer = () =>
    renderWhole({
      renderOptions: {
        renderDescription: true,
        renderOption: false,
        renderTags: true,
        renderOriginalText: true
      },
      originalTextOptions: {
        showEdit: false,
        clickToEdit: false
      },
      tagsOptions: {
        gap: 6,
        containerClassName: tagsClass
      },
      fromOptions: {
        style: {
          fontSize: 14
        }
      },
      columnGap: 6,
      titleOptions: {
        originalTextStyle: {
          fontSize: 14,
          marginTop: 3
        },
        showEditBoxShadow: false,
        ellipsisLine: 0,
        style: {
          fontSize: 17,
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap'
        },
        clickToEdit: metaObject?.type?.includes('Label'),
        showAddNote: nodeState?.focused ? true : false
      },
      descriptionOptions: {
        ellipsisLine: 0
      },
      containerStyle: {
        padding: 12,
        width: '100%',
        height: 'auto'
      }
    })

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
          return <WebpageNode node={{ webpageId: metaObject.objectId }} />
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
                noteId: metaObject.objectId
              }}
            />
          )
        }
        case 'code':
          return (
            <div style={{ width: '800px', maxWidth: '100%', minWidth: '100%', minHeight: '100%', maxHeight: '100%' }}>
              <Code id={metaObject.objectId} />
            </div>
          )
        case 'syncedBlock':
          return <SyncedBlockNode node={node} />
        default: {
          return hasImage ? hasImageRenderer() : commonRenderer()
        }
      }
    }
  }
  return expanded ? (
    <DockTabPaneContext.Provider value={{ currentTabId: '' }}>{renderExpanded()}</DockTabPaneContext.Provider>
  ) : hasImage ? (
    hasImageRenderer()
  ) : (
    commonRenderer()
  )
}

const measureTextCanvas = document.createElement('canvas')
const ctx = measureTextCanvas.getContext('2d')!
ctx.font = '17px Inter'
const getTextWidth = (str: string) => {
  return ctx.measureText(str).width
}
export default memo(MetaObjectNode)
