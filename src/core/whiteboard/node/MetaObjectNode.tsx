import { useMemoizedFn, useUpdateEffect } from '@/hooks'
import { IWhiteboardNode } from '~/typings/data'
import { Content, Icon, Tooltip } from '@/components/base'
import ClassName from '@/styles/classNames'
import { FC, memo, useEffect, useMemo, useRef } from 'react'
import { InnerNodeProps } from './WrapperNode'
import { useFlow } from '../hooks'
import PdfNode from './PdfNode'
import NoteNode from './NoteNode'
import { useRenderObject } from '@/core'
import FontSize from '@/consts/font'
import WebpageNode from '@/core/whiteboard/node/WebpageNode'
import { Rendevoz } from '@/core/rendevoz'
import { useWhiteboardInstance } from '@/core/whiteboard/hooks/useWhiteboardInstance'
import SyncedBlockNode from '@/core/whiteboard/node/SyncedBlockNode'
import Video from '@/core/media/wrappers/Video'
import Audio from '@/core/media/wrappers/Audio'
import { MetaGroupPage } from '@/scenes'
import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'

const MetaObjectNode: FC<InnerNodeProps> = ({ node: n, setPopoverElements, setNodeState, onNameChange }) => {
  const node = n as IWhiteboardNode & { type: 'metaObject' }
  const { expanded } = node
  const { metaObjectId } = node
  const instance = useWhiteboardInstance()
  const { renderWhole, metaObject } = useRenderObject({
    metaObjectId: metaObjectId!
  })

  const hasSize = node.width && node.height
  const imageRef = useRef<HTMLImageElement>(null)
  const flow = useFlow()
  const wholeContainerRef = useRef<HTMLDivElement>(null)
  const toggleExpanded = useMemoizedFn(() => {
    instance.updateNode?.(node.id, n => ({
      ...n,
      expanded: !n.expanded
    }))
  })
  const getNodeState = useMemoizedFn(() => {
    return node
  })

  useEffect(() => {
    if (metaObject?.type) {
      if (['note', 'pdf', 'image', 'webpage', 'video', 'syncedBlock', 'group', 'audio'].includes(metaObject.type)) {
        setPopoverElements?.(eles => {
          return [
            ...eles,
            () => (
              <Tooltip position="top" content="Show Object Info">
                <Icon
                  size={18}
                  className={ClassName.circleButton(undefined, 4)}
                  name="park-info"
                  onClick={() => {
                    if (metaObjectId) {
                      Rendevoz.Actions.Open.openSidebarObjectDetails(metaObjectId)
                    }
                    setNodeState?.(s => ({ ...s, popoverVisible: false }))
                  }}
                />
              </Tooltip>
            ),
            ['note', 'webpage', 'video', 'pdf', 'syncedBlock', 'audio', 'group'].includes(metaObject.type)
              ? () => (
                  <Tooltip position="top" content={!getNodeState().expanded ? 'Expand Node' : 'Fold Node'}>
                    <Icon
                      size={18}
                      className={ClassName.circleButton(undefined, 4)}
                      name={getNodeState().expanded ? 'park-collapse-text-input' : 'park-expand-text-input'}
                      onClick={() => {
                        instance.updateNode?.(
                          node.id,
                          n => ({
                            ...n,
                            width: undefined,
                            height: undefined
                          }),
                          false
                        )
                        toggleExpanded()
                      }}
                    />
                  </Tooltip>
                )
              : () => <></>,
            () => (
              <Tooltip position="top" content={'Open In Sidebar'}>
                <Icon
                  size={18}
                  className={ClassName.circleButton(undefined, 4)}
                  name={'park-right-bar'}
                  onClick={() => {
                    console.log('focus here')
                    flow.onNodeFocus?.(node)
                  }}
                />
              </Tooltip>
            )
          ]
        })
      } else {
        setPopoverElements?.(eles => {
          return [
            ...eles,
            () => (
              <Tooltip position="top" content="Show Object Info">
                <Icon
                  size={18}
                  className={ClassName.circleButton(undefined, 4)}
                  name="park-info"
                  onClick={() => {
                    if (metaObjectId) {
                      Rendevoz.Actions.Open.openSidebarObjectDetails(metaObjectId)
                    }
                    setNodeState?.(s => ({ ...s, popoverVisible: false }))
                  }}
                />
              </Tooltip>
            )
          ]
        })
      }
    }
  }, [metaObject?.type])

  useEffect(() => {
    setTimeout(() => {
      if (metaObject?.name) {
        if (metaObject.name !== node.name) {
          onNameChange?.(metaObject?.name)
        }
      }
    })
  }, [metaObject?.name])

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
      titleOptions: {
        style: {
          fontSize: FontSize['14px'],
          whiteSpace: 'pre-wrap'
        },
        ellipsisLine: 0
      },
      descriptionOptions: {
        style: {
          fontSize: FontSize['13px']
        },
        ellipsisLine: 0
      },
      fromOptions: {
        style: {
          fontSize: FontSize['12px'],
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
    <Content
      fullWidth
      flex
      column
      style={{ width: 450, minHeight: '100%', maxHeight: '100%', minWidth: '100%', maxWidth: '100%', overflowY: 'overlay' }}
    >
      <img
        draggable={false}
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
          padding: '10px',
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
    width = Math.min(getTextWidth(metaObject?.name || 'Default Name') + 30, 450)
  }

  const CommonRenderer = () =>
    renderWhole({
      renderOptions: {
        renderDescription: true,
        renderOption: false,
        renderTags: true,
        renderOriginalText: true
      },
      titleOptions: {
        ellipsisLine: 0,
        style: {
          whiteSpace: 'pre-wrap'
        },
        showAddNote: false
      },
      containerStyle: {
        padding: 8,
        width,
        minWidth: '100%',
        maxWidth: '100%',
        minHeight: '100%',
        maxHeight: '100%',
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
            <div style={{ width: '1000px', maxWidth: '100%', minWidth: '100%', height: 800, minHeight: '100%', maxHeight: '100%' }}>
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
                height: 365,
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
          return (
            <WebpageNode
              node={{ webpageId: metaObject.objectId }}
              onTitleChange={v => {
                onNameChange?.(v)
              }}
            />
          )
        case 'video':
          return (
            <div style={{ width: '800px', maxWidth: '100%', minWidth: '100%', height: 450, minHeight: '100%', maxHeight: '100%' }}>
              <Video onlyCore={true} videoId={metaObject.objectId} />
            </div>
          )
        case 'note': {
          return (
            <NoteNode
              node={{
                noteId: metaObject.objectId
              }}
            />
          )
        }
        case 'syncedBlock':
          return <SyncedBlockNode node={node} />
        default: {
          return hasImage ? hasImageRenderer() : <CommonRenderer />
        }
      }
    }
  }
  return expanded ? (
    <DockTabPaneContext.Provider value={{ currentTabId: '' }}>{renderExpanded()}</DockTabPaneContext.Provider>
  ) : hasImage ? (
    hasImageRenderer()
  ) : (
    <CommonRenderer />
  )
}

const measureTextCanvas = document.createElement('canvas')
const ctx = measureTextCanvas.getContext('2d')!
ctx.font = '15px opensans'
const getTextWidth = (str: string) => {
  return ctx.measureText(str).width
}
export default memo(MetaObjectNode)
