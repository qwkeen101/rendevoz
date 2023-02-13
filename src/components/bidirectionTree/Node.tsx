import { metaObjectsAtom, useMetaTargetObject } from '@/stores/meta.store'
import { globalStore } from '@/stores/stores'
import produce from 'immer'
import { useAtomValue, useStore } from 'jotai/react'
import { FC, memo, useEffect, useMemo, useRef, useState } from 'react'
import { useFlow, useSetTreeEdges, useSetTreeNodes } from './hooks'
import { ITreeNode } from './types'
import { useRafFn } from '@/hooks'
import { AnimatePopover, Content, Icon, Image, Tooltip, WithBorder } from '../base'
import { Tag } from '../form/EditMetaObjectForm'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Rnd } from 'react-rnd'
import { typeToTypeRecord } from '../knowledgeDatabase/card/DatabaseCard'
import Zindexes from '@/consts/zindex'
import { EditorV1 } from '../editor/Editor'
import Id from '@/utils/id'
import { PdfViewer } from '../pdf/PdfViewer'
import { documentsAtom } from '@/stores/document.store'
import { expandNode } from './utils'

const nodeClassName = css({
  boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
  borderRadius: 8,
  fontFamily: 'Muli',
  padding: '6px 8px',
  background: 'white',
  overflow: 'hidden',
  pointerEvents: 'auto'
})
const TreeNode: FC<ITreeNode> = ({ id, x, y }) => {
  const metaObject = useAtomValue(metaObjectsAtom, { store: globalStore }).get(Number(id))
  const containerRef = useRef<HTMLDivElement>()
  const flow = useFlow()
  const setNodes = useSetTreeNodes()
  const setEdges = useSetTreeEdges()
  const canExpand = metaObject?.type && metaObject.objectId && ['note', 'pdf', 'normal'].includes(metaObject?.type)
  const store = useStore()
  const editorId = useMemo(() => Id.getStrId(), [])
  const [nodeState, setNodeState] = useState<{
    in?: boolean
    expanded?: boolean
    size?: { width: number | string; height: number | string }
  }>({
    in: false,
    expanded: false,
    size: {
      width: 400,
      height: 500
    }
  })
  useEffect(() => {
    if (containerRef.current) {
      flow?.ID_TO_NODE_ELEMENT_MAP.set(id, {
        element: containerRef.current
      })
    }
  })

  const handleExpandNode = (direction: 'left' | 'right' | 'all') => {
    const result = expandNode(id, { x, y }, direction)
    if (result) {
      const { nodes, edges } = result
      console.log(nodes, edges)
      setNodes(nodez =>
        produce(nodez, draft => {
          nodes.forEach(n => {
            if (!nodez.has(n.id)) {
              draft.set(n.id, n)
            }
          })
        })
      )
      setEdges(edgez =>
        produce(edgez, draft => {
          edges.forEach(i => {
            if (!edgez.has(i.id)) {
              draft.set(i.id, i)
            }
          })
        })
      )
    }
  }
  useEffect(() => {
    rafUpdateEdge()
  }, [nodeState.expanded])
  const rafUpdateEdge = useRafFn(() => {
    flow?.ID_TO_EDGE_MAP.forEach(i => i.drawPath())
  })

  const renderExpanded = () => {
    if (!metaObject?.objectId) return
    switch (metaObject?.type) {
      case 'note':
        return <EditorV1 readonly id={editorId} noteId={metaObject.objectId} />
      case 'normal':
        return <EditorV1 readonly id={editorId} noteId={metaObject.objectId} />
      case 'pdf':
        return <PdfViewer document={globalStore.get(documentsAtom).get(metaObject.objectId)} />
    }
  }
  return (
    <Rnd
      ref={node => {
        containerRef.current = node?.getSelfElement()
      }}
      onMouseDown={e => {
        e.preventDefault()
        e.stopPropagation()
      }}
      position={{ x, y }}
      enableResizing={nodeState.expanded ? true : false}
      style={{
        zIndex: nodeState.expanded ? 1000 : undefined
      }}
      className={nodeClassName}
      onResize={() => {
        rafUpdateEdge()
      }}
      onResizeStop={(e, dir, ele, delta, pos) => {
        const bound = ele.getBoundingClientRect()
        setNodeState(s => ({
          ...s,
          size: {
            height: bound.height / flow?.containerTransformScale,
            width: bound.width / flow?.containerTransformScale
          }
        }))
        setNodes(nodes =>
          produce(nodes, draft => {
            draft.set(id, {
              id,
              x: pos.x,
              y: pos.y
            })
          })
        )
      }}
      onDrag={() => {
        rafUpdateEdge()
      }}
      onDragStop={(e, data) => {
        setNodes(nodes =>
          produce(nodes, draft => {
            draft.set(id, {
              id,
              x: data.x,
              y: data.y
            })
          })
        )
      }}
      size={{
        height: nodeState.expanded ? nodeState.size?.height || 'auto' : 'auto',
        width: nodeState.expanded ? nodeState.size?.width || 'auto' : 'auto'
      }}
      scale={flow?.containerTransformScale}
    >
      <AnimatePopover
        visible={!!nodeState.in}
        positions={['top']}
        reposition={false}
        padding={10}
        containerStyle={{ zIndex: String(Zindexes.Tooltip + 1) }}
        content={
          <WithBorder
            style={{ display: 'flex', gap: 6, padding: '2px 6px' }}
            onPointerEnter={() => setNodeState(s => ({ ...s, in: true }))}
            onPointerLeave={() => setNodeState(s => ({ ...s, in: false }))}
          >
            {canExpand && (
              <Tooltip position="top" content="Expand/Fold Content">
                <Icon
                  size={18}
                  className={ClassName.circleButton(undefined, 4)}
                  onClick={() => setNodeState(s => ({ ...s, expanded: !s.expanded }))}
                  name="park-expand-down"
                />
              </Tooltip>
            )}
            <Tooltip position="top" content="Show more related nodes">
              <Icon
                size={18}
                className={ClassName.circleButton(undefined, 4)}
                name="park-mindmap-map"
                onClick={() => handleExpandNode('all')}
              />
            </Tooltip>
          </WithBorder>
        }
      >
        <Content
          onPointerEnter={() => setNodeState(s => ({ ...s, in: true }))}
          onPointerLeave={() => setNodeState(s => ({ ...s, in: false }))}
          flex
          gap={10}
          fullHeight
          alignItems="center"
          style={{
            minWidth: 150,
            maxWidth: nodeState.expanded ? undefined : 250
          }}
          onWheelCapture={e => {
            e.stopPropagation()
          }}
        >
          {nodeState.expanded ? (
            <div style={{ width: '100%', height: '100%', overflow: 'hidden', padding: '8px 4px' }}>{renderExpanded()}</div>
          ) : (
            <>
              {metaObject?.coverImgSrc && <Image src={metaObject.coverImgSrc} width={60} style={{ borderRadius: 6 }} />}
              <Content flex column gap={3}>
                <Content
                  flex
                  gap={4}
                  style={{ flexWrap: 'wrap' }}
                  className={css({
                    '> *': {
                      fontSize: '11px !important'
                    }
                  })}
                >
                  <div
                    style={{
                      background: 'rgb(220,227,232)',
                      color: 'rgb(82,102,116)',
                      borderRadius: '4px',
                      padding: '0px 6px 0px 6px',
                      fontFamily: 'Muli',
                      width: 'fit-content',
                      whiteSpace: 'nowrap',
                      textTransform: 'capitalize'
                    }}
                  >
                    {typeToTypeRecord[metaObject?.type || 'normal']}
                  </div>
                  {metaObject?.tags?.map(tag => (
                    <Tag key={tag} tag={tag} small hideSize hideDetails />
                  ))}
                </Content>
                <div className={ClassName.title('14px')}>{metaObject?.name}</div>
                <div className={ClassName.description('12px')}>{metaObject?.description}</div>
              </Content>
            </>
          )}
        </Content>
      </AnimatePopover>
    </Rnd>
  )
}

export default memo(TreeNode)
