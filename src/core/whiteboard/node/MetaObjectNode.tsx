import { useMemoizedFn, useUpdateEffect } from '@/hooks'
import { IWhiteboardNode } from '~/typings/data'
import { Content, Icon, Tooltip } from '@/components/base'
import ClassName from '@/styles/classNames'
import { FC, memo, useEffect, useMemo, useRef, useState } from 'react'
import { InnerNodeProps } from './WrapperNode'
import { useFlow, useSetWhiteboardNodes } from '../hooks'
import produce from 'immer'
import PdfNode from './PdfNode'
import NoteNode from './NoteNode'
import { useRenderObject, Video } from '@/core'
import { css } from '@emotion/css'
import { GlobalEventEmitter } from '@/events'
import FontSize from '@/consts/font'
import WebpageNode from '@/core/whiteboard/node/WebpageNode'
import VideoCore from '@/core/video/VideoCore'
import { Rendevoz } from '@/core/rendevoz'

const MetaObjectNode: FC<InnerNodeProps> = ({ node: n, setPopoverElements, setNodeState, onNameChange }) => {
  const node = n as IWhiteboardNode & { type: 'metaObject' }
  const { expanded } = node
  const { metaObjectId } = node
  const updateNodes = useSetWhiteboardNodes()

  const { renderWhole, metaObject, renderInline } = useRenderObject({
    metaObjectId: metaObjectId!
  })
  console.log(metaObject)
  const hasSize = node.width && node.height
  const imageRef = useRef<HTMLImageElement>(null)
  const flow = useFlow()
  const wholeContainerRef = useRef<HTMLDivElement>(null)
  const toggleExpanded = useMemoizedFn(() => {
    updateNodes(nodes =>
      produce(nodes, draft => {
        draft.set(node.id, {
          ...node,
          expanded: !node.expanded
        })
      })
    )
  })
  const getNodeState = useMemoizedFn(() => {
    return node
  })

  useEffect(() => {
    if (metaObject?.type) {
      if (['note', 'pdf', 'image', 'webpage', 'video'].includes(metaObject.type)) {
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
            ['note', 'webpage', 'video', 'pdf'].includes(metaObject.type)
              ? () => (
                  <Tooltip position="top" content={!getNodeState().expanded ? 'Expand Node' : 'Fold Node'}>
                    <Icon
                      size={18}
                      className={ClassName.circleButton(undefined, 4)}
                      name={getNodeState().expanded ? 'park-collapse-text-input' : 'park-expand-text-input'}
                      onClick={() => {
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

  useUpdateEffect(() => {
    if (expanded !== undefined) {
      console.log('update nodes expand')
      updateNodes(nodes =>
        produce(nodes, draft => {
          draft.set(node.id, {
            ...node,
            width: undefined,
            height: undefined
          })
        })
      )
    }
  }, [expanded])
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
        renderDescription: true
      },
      titleOptions: {
        style: {
          fontSize: FontSize['14px'],
          whiteSpace: 'pre-wrap'
        },
        ellipsisLine: 999
      },
      descriptionOptions: {
        style: {
          fontSize: FontSize['13px']
        }
      },
      fromOptions: {
        style: {
          fontSize: FontSize['12px'],
          gap: '0.3rem'
        },
        className: ClassName.ellipsisFont(1)
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
        updateNodes(nodes =>
          produce(nodes, draft => {
            const origin = nodes.get(node.id)
            if (!origin?.height) return
            draft.set(node.id, {
              ...origin,
              height: origin.height + heightOffset
            })
          })
        )
      }
    }
  }, [hasImage])
  const hasImageRenderer = () => (
    <Content fullWidth flex column style={{ height: 450, minHeight: '100%', maxHeight: '100%' }}>
      <img
        draggable={false}
        ref={imageRef}
        src={metaObject?.coverImgSrc}
        style={{
          position: 'relative',
          width: '100%',
          objectFit: 'cover',
          flex: 1,
          overflow: 'hidden'
        }}
      />
      <div
        ref={wholeContainerRef}
        style={{
          padding: '10px',
          minWidth: '100%',
          width: 'auto',
          maxWidth: '400px',
          height: 'auto'
        }}
      >
        {renderWhole(renderOptions)}
      </div>
    </Content>
  )
  const CommonRenderer = () =>
    renderWhole({
      renderOptions: {
        renderDescription: true,
        renderOption: false,
        renderTags: true
      },
      titleOptions: {
        ellipsisLine: 1000,
        style: {
          whiteSpace: 'pre-wrap'
        }
      },
      containerStyle: {
        padding: 8,
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
            <div style={{ width: '450px', maxWidth: '100%', minWidth: '100%', height: 253, minHeight: '100%', maxHeight: '100%' }}>
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
        default: {
          return hasImage ? hasImageRenderer() : <CommonRenderer />
        }
      }
    }
  }
  return expanded ? renderExpanded() : hasImage ? hasImageRenderer() : <CommonRenderer />
}

export default memo(MetaObjectNode)
