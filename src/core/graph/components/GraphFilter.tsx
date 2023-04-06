import { Content, Icon } from '@/components/base'
import { SimpleObject, FilterNameSearchAtom, DatabaseFilter } from '@/core'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useVirtualizer } from '@tanstack/react-virtual'
import produce from 'immer'
import { useAtom, useAtomValue, useStore } from 'jotai'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Rnd } from 'react-rnd'
import { GlobalGraphInstance } from '..'
import useGraph from '../hooks/useGraph'
import { GraphPinNodesIdsAtom, GraphVisibleNodesIdsAtom } from '../hooks/useGraphFilter'
import useGraphNodes, { GraphNodesAtom } from '../hooks/useGraphNodes'

const graphFilterTitleClassName = css({
  cursor: 'grab',
  fontFamily: 'Muli',
  padding: '4px 12px'
})
const GraphFilter = () => {
  const [search, setSearch] = useAtom(FilterNameSearchAtom)
  const { t } = useTranslation()
  const [, setNodes] = useGraphNodes()
  const graphVisibleNodesIds = useAtomValue(GraphVisibleNodesIdsAtom)
  const [pinnedNodesIds, setPinnedNodesIds] = useAtom(GraphPinNodesIdsAtom)
  const store = useStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const graph = useGraph()
  const virtualizer = useVirtualizer({
    count: graphVisibleNodesIds.length,
    estimateSize: () => 100,
    getScrollElement: () => containerRef.current,
    overscan: 10
  })
  const items = virtualizer.getVirtualItems()
  const [showBoxShadow, toggleShowBoxShadow] = useToggle(false)
  const handleFocus = (nodeId: number) => {
    const graphNodes = store.get(GraphNodesAtom)
    if (graphNodes && graph) {
      const targetNode = graphNodes.find(n => n.id === nodeId)
      if (targetNode && targetNode.x !== undefined && targetNode.y !== undefined) {
        const bound = graph.container?.node()?.getBoundingClientRect()
        if (bound) {
          const zoom = graph.panzoom?.getTransform().scale || 1
          setNodes(nodes =>
            nodes
              ? produce(nodes, draft => {
                  nodes?.forEach((n, idx) => {
                    if (n.isCenter && n.id !== nodeId) {
                      draft[idx].isCenter = false
                    }
                    if (n.id === nodeId) {
                      draft[idx].isCenter = true
                    }
                  })
                })
              : nodes
          )
          if (Math.abs(zoom - 1) < 0.1) {
            graph.panzoom?.smoothMoveTo(-targetNode.x + bound.width / 2, -targetNode.y + bound.height / 2)
          } else {
            // wtf is this?
            graph.panzoom?.moveTo(-targetNode.x * zoom + bound.width / 2 / zoom, -targetNode.y * zoom + bound.height / 2 / zoom)
            graph.panzoom?.smoothZoomAbs(bound.width / 2 / zoom, bound.height / 2 / zoom, 1)
          }
        }
      }
    }
  }

  const handleHighlightRelated = (nodeId: number) => {
    if (pinnedNodesIds.has(nodeId)) {
      setPinnedNodesIds(ns =>
        produce(ns, draft => {
          draft.delete(nodeId)
        })
      )
    } else {
      setPinnedNodesIds(ns =>
        produce(ns, draft => {
          draft.add(nodeId)
        })
      )
    }
  }
  useEffect(() => {
    const container = containerRef.current
    const containerScrollHandler = (e: Event) => {
      if ((e.target as HTMLElement).scrollTop > 0) {
        toggleShowBoxShadow(true)
      } else {
        toggleShowBoxShadow(false)
      }
    }
    if (container) {
      container.addEventListener('scroll', containerScrollHandler)
    }
    return () => {
      container?.removeEventListener('scroll', containerScrollHandler)
    }
  }, [])
  return (
    <Rnd
      style={{ borderRadius: 6, overflow: 'hidden' }}
      default={{
        x: -175,
        y: 0,
        width: 340,
        height: '50vh'
      }}
      maxHeight="70vh"
      maxWidth="50vw"
      dragHandleClassName={graphFilterTitleClassName}
    >
      <Content flex column fullHeight fullWidth className={ClassName.Background.pseudoBlubBackground}>
        <Content
          flex
          column
          gap={10}
          style={{
            padding: '0px 12px 10px'
          }}
        >
          <div
            style={{
              borderBottom: '1px solid rgba(0,0,0,0.07)',
              cursor: 'grab',
              padding: '8px 0px 4px',
              display: 'flex',
              gap: 10,
              alignItems: 'baseline'
            }}
            className={graphFilterTitleClassName}
          >
            <div className={ClassName.title('14px')}>Graph Filter</div>
            <div className={ClassName.description()}>Total Nodes: {graphVisibleNodesIds.length}</div>
          </div>
          <Content
            style={{
              background: 'transparent',
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.1)',
              padding: '4px 12px',
              height: '32px'
            }}
            flex
            alignItems="center"
            gap={10}
          >
            <Icon name="park-search" />
            <input
              placeholder={t('database.search for object', { object: t('general.object') })}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={css({
                border: 'none',
                outline: 'none',
                background: 'inherit',
                flexGrow: 1
              })}
            />
          </Content>
          <DatabaseFilter />
        </Content>

        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            fontFamily: 'Muli',
            position: 'relative',
            padding: '12px',
            paddingTop: 0,
            boxShadow: showBoxShadow ? 'rgb(55 53 47 / 9%) 0px 4px 3px -3px inset' : undefined,
            transition: 'box-shadow 0.3s ease'
          }}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${items[0]?.start}px)`
              }}
            >
              {items.map(row => {
                const nodeId = graphVisibleNodesIds[row.index]
                const isPinned = pinnedNodesIds.has(nodeId)
                return (
                  <div
                    key={row.key}
                    data-index={row.index}
                    ref={virtualizer.measureElement}
                    className={css({
                      ':first-child': {
                        paddingTop: 0
                      },
                      ':not(:last-child)': {
                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                      },
                      padding: '10px 0px'
                    })}
                  >
                    <SimpleObject
                      renderDescription={false}
                      renderFrom={false}
                      draggable={false}
                      iconPopover={
                        <>
                          <div onClick={() => handleFocus(nodeId)} className={ClassName.flatButton()}>
                            Focus
                          </div>
                          <div onClick={() => handleHighlightRelated(nodeId)} className={ClassName.flatButton()}>
                            {isPinned ? 'Unpin' : 'Pin'}
                          </div>
                        </>
                      }
                      onNavigate={() => {
                        GlobalGraphInstance.minimize?.()
                      }}
                      descriptionClassName={css([ClassName.description(), ClassName.ellipsisFont(2)])}
                      iconName={isPinned ? 'park-pin' : 'park-more'}
                      iconColor={isPinned ? '	rgba(255,215,0,0.7)' : undefined}
                      heavyIconColor={isPinned ? 'rgba(255,215,0,1)' : undefined}
                      metaObjectId={graphVisibleNodesIds[row.index]}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Content>
    </Rnd>
  )
}

export default GraphFilter
