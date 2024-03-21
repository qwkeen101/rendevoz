import { IWhiteboardNode } from '~/typings'
import { Icon } from '@/components'
import { Colors } from '@/consts'
import { memo, RefObject } from 'react'
import { ClassName } from 'rendevoz'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import Id from '@/utils/id'
import { getFlattenChildrenOfNode } from '@/core/components/whiteboard/node/mindmap/utils/tree'
import { css } from '@emotion/css'
import { useIsIn, useSelectAtomValue } from '@/hooks'
import { WhiteboardStateAtom } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import { selectAtom } from 'jotai/utils'
import { useAtomValue } from 'jotai'

type direction = 'right' | 'left'
const rightClazz = css({
  position: 'absolute',
  right: 0,
  top: '50%',
  display: 'flex',
  gap: 10,
  transform: 'translate(calc(100% + 10px), -50%)',
  transition: 'opacity 0.2s ease'
})
const leftClazz = css({
  position: 'absolute',
  left: 0,
  top: '50%',
  display: 'flex',
  gap: 10,
  transform: 'translate(calc(-100% - 10px), -50%)',
  transition: 'opacity 0.2s ease'
})
const readOnlyAtom = selectAtom(WhiteboardStateAtom, s => s.readOnly)
export default memo(({ node, containerRef }: { node: IWhiteboardNode; containerRef?: RefObject<HTMLDivElement> }) => {
  const instance = useWhiteboardInstance()
  const { isIn } = useIsIn(containerRef)
  const readOnly = useAtomValue(readOnlyAtom)
  const getSubNodeLength = (direction: direction) => {
    const all = getFlattenChildrenOfNode(node, instance, direction) || []
    return all.length
  }
  const isCollapse = (direction: direction) => {
    return node.type === 'mindmap' ? node[direction === 'right' ? 'rightCollapse' : 'leftCollapse'] === true : node.collapseChildren
  }

  const handleAddSubNode = (direction: direction) => {
    //
    if (node.type === 'mindmap') {
      instance.updateWhiteboard?.(w => {
        const newNodeId = Id.getId()
        const maxZ = instance.nodeOps?.getMaxZindex() ?? 0
        w.nodes?.set(newNodeId, {
          id: newNodeId,
          x: 0,
          y: 0,
          width: 100,
          type: 'text',
          rootId: node.id,
          side: direction,
          borderType: node.borderType,
          border: node.border,
          z: maxZ,
          content: [{ id: Id.getId(), type: 'paragraph', children: [{ text: '' }] }]
        })
        const origin = w.nodes?.get(node.id)
        if (origin && origin.type === 'mindmap') {
          w.nodes?.set(origin.id, {
            ...origin,
            leftChildren: direction === 'left' ? [...(origin.leftChildren || []), { root: newNodeId, children: [] }] : origin.leftChildren,
            rightChildren:
              direction === 'right' ? [...(origin.rightChildren || []), { root: newNodeId, children: [] }] : origin.rightChildren
          })
        }
      })
    } else {
      console.log('ad here')
      instance
        .insertNode?.({
          x: 0,
          y: 0,
          width: 100,
          border: node.border,
          type: 'text',
          side: direction,
          borderType: node.borderType,
          content: [{ id: Id.getId(), type: 'paragraph', children: [{ text: '' }] }]
        })
        .then(n => {
          if (n.length === 1) {
            Array.from(instance.values.ID_TO_NODE_MAP.values()).forEach(i => {
              i.onAddSubNode?.(node.id, n[0], 0, direction)
            })
          }
        })
    }
  }
  const handleCollape = (direction: direction) => {
    if (node.type === 'mindmap') {
      instance.updateWhiteboard?.(w => {
        const key = direction === 'right' ? 'rightCollapse' : 'leftCollapse'

        const origin = w.nodes?.get(node.id)
        if (origin) {
          const nextValue = !origin[key]

          w.nodes?.set(origin.id, { ...origin, [key]: nextValue })
          const allSubChildren = getFlattenChildrenOfNode(origin, instance, direction)
          const collapseChangeNodeIds: number[] = [node.id]
          allSubChildren?.forEach(c => {
            const origin = w.nodes?.get(c.root)
            if (origin) {
              if (typeof origin.collapse === 'number' && origin.collapse !== node.id) return
              w.nodes?.set(origin.id, { ...origin, collapse: nextValue === false ? false : node.id })
              collapseChangeNodeIds.push(origin.id)
            }
          })
          if (collapseChangeNodeIds?.length) {
            setTimeout(() => {
              Array.from(instance.values.ID_TO_NODE_MAP.values()).forEach(i => {
                i.onNodeCollapse?.(collapseChangeNodeIds, nextValue)
              })
            })
          }
        }
      })
    }
    if (node.rootId) {
      const allSubs = getFlattenChildrenOfNode(node, instance, node.side)
      instance.updateWhiteboard?.(w => {
        const origin = w.nodes?.get(node.id)
        if (origin) {
          const nextValue = !origin.collapseChildren
          w.nodes?.set(origin.id, { ...origin, collapseChildren: nextValue })
          const collapseChangeNodeIds: number[] = [node.id]
          allSubs?.forEach(id => {
            const n = w.nodes?.get(id.root)
            if (n) {
              if (typeof n.collapse === 'number' && n.collapse !== node.id) return
              w.nodes?.set(n.id, { ...n, collapse: nextValue === false ? false : node.id })
            }
          })
          if (collapseChangeNodeIds?.length) {
            setTimeout(() => {
              Array.from(instance.values.ID_TO_NODE_MAP.values()).forEach(i => {
                i.onNodeCollapse?.([...collapseChangeNodeIds], nextValue)
              })
            })
          }
        }
      })
    }
  }
  const renderCollapse = (direction: direction) => {
    const alreadyCollapse = isCollapse(direction)
    const nodeLength = getSubNodeLength(direction)
    if (nodeLength === 0) return null
    return (
      <div
        data-disable-add-sub
        onClick={() => handleCollape(direction)}
        className={'border'}
        data-disable-drag
        style={{
          borderRadius: 999,
          top: '50%',
          cursor: 'pointer',
          color: Colors.Common.SelectColor,
          backgroundColor: Colors.Background.Global
        }}
      >
        {alreadyCollapse ? (
          <div
            className={ClassName.circleButton(undefined, 999)}
            style={{
              fontWeight: 600,
              width: 30,
              fontSize: 14,
              height: 30,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getSubNodeLength(direction)}
          </div>
        ) : (
          <Icon size={22} name={'park-minus'} className={ClassName.circleButton(4, 999)} />
        )}
      </div>
    )
  }
  const renderAdd = (direction: direction) => {
    const alreadyCollapse = isCollapse(direction)
    if (alreadyCollapse) {
      return null
    }
    return (
      <div
        data-disable-drag
        onPointerDown={e => {
          e.button === 0 && handleAddSubNode(direction)
        }}
        data-disable-add-sub
        className={'border'}
        style={{
          borderRadius: 999,
          cursor: 'pointer',
          color: Colors.Common.SelectColor,
          backgroundColor: Colors.Background.Global
        }}
      >
        <Icon size={22} name={'park-plus'} className={ClassName.circleButton(4, 999)} />
      </div>
    )
  }
  if (readOnly) return null
  if (node.type === 'mindmap') {
    const rightCollapse = isCollapse('right')
    const leftCollapse = isCollapse('left')
    return (
      <>
        <div
          className={rightClazz}
          style={{
            opacity: isIn || rightCollapse ? 1 : 0
          }}
        >
          {renderAdd('right')}
          {renderCollapse('right')}
        </div>
        <div
          className={leftClazz}
          style={{
            opacity: isIn || leftCollapse ? 1 : 0
          }}
        >
          {renderCollapse('left')}
          {renderAdd('left')}
        </div>
      </>
    )
  }
  if (node.rootId) {
    if (node.side === 'right') {
      const rightCollapse = isCollapse('right')
      return (
        <>
          <div
            className={rightClazz}
            style={{
              opacity: isIn || rightCollapse ? 1 : 0
            }}
          >
            {renderAdd('right')}
            {renderCollapse('right')}
          </div>
        </>
      )
    }
    if (node.side === 'left') {
      const leftCollapse = isCollapse('left')
      return (
        <>
          <div
            className={leftClazz}
            style={{
              opacity: leftCollapse || isIn ? 1 : 0
            }}
          >
            {renderCollapse('left')}
            {renderAdd('left')}
          </div>
        </>
      )
    }
  }
  return null
})
