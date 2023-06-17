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
import { useRenderObject } from '@/core'
import { css } from '@emotion/css'
import { GlobalEventEmitter } from '@/events'
import FontSize from '@/consts/font'

const MetaObjectNode: FC<InnerNodeProps> = ({ node: n, setPopoverElements, setNodeState, onNameChange }) => {
  const node = n as IWhiteboardNode & { type: 'metaObject' }
  const { expanded } = node
  const { metaObjectId } = node
  const updateNodes = useSetWhiteboardNodes()
  const { renderWhole, metaObject } = useRenderObject({ metaObjectId: metaObjectId! })
  const hasSize = node.width && node.height
  const [contentMinHeight, setContentMinHeight] = useState(0)
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
    if (!wholeContainerRef.current?.firstChild) return

    setTimeout(() => {
      if (!n.width || !n.height) return
      const renderWholeBounding = (wholeContainerRef.current?.firstChild as HTMLElement).getBoundingClientRect()
      const width = n.width

      const padding = (width / 100) * 35
      setContentMinHeight(renderWholeBounding.height / flow.containerTransformScale + padding)
    }, 100)
  }, [metaObject, n.width, n.height])
  useEffect(() => {
    if (metaObject?.type) {
      if (['note', 'pdf', 'image', 'webpage', 'video'].includes(metaObject.type)) {
        setPopoverElements?.(eles => {
          return [
            ...eles,
            () => (
              <Tooltip position="top" content="Edit Object Details">
                <Icon
                  size={18}
                  className={ClassName.circleButton(undefined, 4)}
                  name="park-edit"
                  onClick={() => {
                    GlobalEventEmitter().emit('global', {
                      type: 'globalNeedEditMetaObject',
                      data: {
                        metaObjectId: metaObject.id
                      }
                    })
                    setNodeState?.(s => ({ ...s, popoverVisible: false }))
                  }}
                />
              </Tooltip>
            ),
            metaObject.type === 'note'
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
              <Tooltip position="top" content="Edit Object Details">
                <Icon
                  size={18}
                  className={ClassName.circleButton(undefined, 4)}
                  name="park-edit"
                  onClick={() => {
                    GlobalEventEmitter().emit('global', {
                      type: 'globalNeedEditMetaObject',
                      data: {
                        metaObjectId: metaObject.id
                      }
                    })
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
        case 'note': {
          return (
            <NoteNode
              node={{
                noteId: metaObject.objectId
              }}
            />
          )
        }
      }
    }
  }
  const hasImage = metaObject?.coverImgSrc !== undefined

  const renderOptions = useMemo(
    () => ({
      renderOptions: {
        renderImage: false,
        renderFrom: true,
        renderDescription: !hasImage
      },
      titleOptions: {
        style: {
          fontSize: hasSize ? `max(4.3cqmax, ${FontSize['15px']})` : undefined,
          color: hasImage ? 'white' : undefined
        }
      },
      descriptionOptions: {
        style: {
          fontSize: hasSize ? `max(${FontSize['14px']},4cqmax)` : undefined,
          color: hasImage ? 'white' : undefined
        }
      },
      fromOptions: {
        style: {
          fontSize: hasSize ? `max(${FontSize['13px']},3.7cqmax)` : undefined,
          gap: 'max(1.5cqmax, 0.3rem)'
        },
        className: ClassName.ellipsisFont(1)
      },
      tagsOptions: {
        containerClassName: hasSize
          ? css([
              { '> *': { fontSize: `max(${FontSize['11px']}, 3cqmax) !important` }, gap: 'max(1.5cqmax, 0.3rem) !important' },
              hasImage
                ? {
                    '> *': {
                      color: 'white',
                      border: '0.5cqmax solid white',
                      padding: '0.5cqmax 1cqmax',
                      borderRadius: '2cqmax',
                      background: 'transparent'
                    }
                  }
                : undefined
            ])
          : undefined
      }
    }),
    [hasSize, hasImage]
  )
  return (
    <>
      {expanded ? (
        renderExpanded()
      ) : (
        <Content fullHeight fullWidth>
          {hasImage && (
            <>
              <div style={{ width: '100%', maxHeight: `calc(100% - ${contentMinHeight}px)`, height: '100%', overflow: 'hidden' }}>
                <div style={{ width: '100%', paddingBottom: '100%' }}></div>
              </div>
              <img
                draggable={false}
                src={metaObject.coverImgSrc}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </>
          )}
          <div
            ref={wholeContainerRef}
            style={{
              padding: hasImage ? '30% 5% 5%' : '4%',
              minWidth: '100%',
              width: 'auto',
              maxWidth: '400px',
              height: 'auto',
              minHeight: hasImage ? (!hasSize ? 'fit-content' : contentMinHeight) : '100%',
              overflow: 'hidden',
              containerType: hasSize ? 'size' : 'normal',
              backgroundImage: hasImage ? 'linear-gradient(rgba(0,0,0,0),rgba(0,0,0,1))' : undefined
            }}
          >
            {renderWhole(renderOptions)}
          </div>
        </Content>
      )}
    </>
  )
}

export default memo(MetaObjectNode)
