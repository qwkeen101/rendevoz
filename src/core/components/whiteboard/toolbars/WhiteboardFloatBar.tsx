import { atom, useAtom } from 'jotai'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import { assignProperties } from '@/utils'
import { AnimatePopover, Content, Icon, Menu, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import classnames from 'classnames'
import { memo, useEffect, useRef } from 'react'
import { IWhiteboardNode, IWhiteboardToolbarState } from '~/typings'
import getContextMenu from '@/core/components/whiteboard/toolbars/contextMenus/getContextMenu'
import { useTranslation } from 'react-i18next'
import getNodeMenu from '@/core/components/whiteboard/toolbars/contextMenus/getNodeMenu'
import WhiteboardEdgeToolbar from '@/core/components/whiteboard/toolbars/WhiteboardEdgeToolbar'
import { useFlow } from '@/core/components/whiteboard/StateHooks'

export const WhiteboardToolbarAtom = atom<IWhiteboardToolbarState>({
  visible: false
})
export default memo(() => {
  const { t } = useTranslation()
  const [toolbarState, setToolbarState] = useAtom(WhiteboardToolbarAtom)
  const instance = useWhiteboardInstance()
  const transformedWindowPosition =
    toolbarState.originX !== undefined &&
    toolbarState.originY !== undefined &&
    instance.coordOps?.transformWhiteboardPositionToWindowPosition({
      x: toolbarState.originX,
      y: toolbarState.originY
    })
  assignProperties(instance, {
    toolbarOps: {
      openEdgeToolbar: (edgeId, pos) => {
        setToolbarState(s => ({ ...s, visible: true, edgeId, originX: pos.x, originY: pos.y, type: 'edge' }))
      },
      closeToolbar: () => {
        setToolbarState(s => ({ ...s, visible: false }))
      },
      openContextMenuToolbar: pos => {
        setToolbarState(s => ({
          ...s,
          visible: true,
          type: 'contextMenu',
          originX: pos.x,
          originY: pos.y
        }))
      },
      getToolbarState: () => toolbarState,
      openNodeToolbar: (nodeId, position, openBy = 'contextMenu') => {
        const node = instance.getNode?.(nodeId)
        if (node) {
          setToolbarState(s => ({
            ...s,
            visible: true,
            type: 'node',
            node,
            openBy,
            originX: position.x,
            originY: position.y
          }))
        }
      },
      openSelectToolbar: position => {
        setToolbarState(s => ({
          ...s,
          visible: true,
          type: 'select',
          originY: position.y,
          originX: position.x
        }))
      }
    }
  })
  const flow = useFlow()

  useEffect(() => {
    if (toolbarState.visible === false) {
      setTimeout(() => {
        flow.focused = true
      })
    }
  }, [toolbarState.visible])
  const renderContent = () => {
    if (toolbarState.type === 'edge') return <WhiteboardEdgeToolbar edgeId={toolbarState.edgeId} />
    const getLayout = () => {
      switch (toolbarState.type) {
        case 'contextMenu':
          return getContextMenu(instance, t)
        case 'node':
        case 'select':
          return getNodeMenu(instance, t, toolbarState.openBy)
      }
    }
    const l = getLayout()
    if (l) {
      return <Menu.NavigationMenu layout={l} />
    }
  }
  const align = () => {
    if (toolbarState.type === 'contextMenu') {
      return 'start'
    }
    if (toolbarState.type === 'select') {
      return 'start'
    }
    return 'start'
  }
  console.log(toolbarState)
  return (
    <AnimatePopover
      visible={toolbarState.visible}
      withClickCover={true}
      onClickOutside={e => {
        setToolbarState(s => ({ ...s, visible: false }))
      }}
      borderRadius={4}
      align={align()}
      position={
        transformedWindowPosition
          ? {
              x: transformedWindowPosition.x + 5,
              y: ['select', 'node'].includes(toolbarState.type) ? transformedWindowPosition.y - 10 : transformedWindowPosition.y
            }
          : {}
      }
      positions={toolbarState.type === 'edge' ? ['top', 'bottom'] : ['right', 'left']}
      content={
        <WithBorder
          blur={true}
          padding={toolbarState.type === 'edge' ? 0 : '0.25rem 0px'}
          width={toolbarState.type === 'edge' ? undefined : 220}
          borderRadius={4}
        >
          {renderContent()}
        </WithBorder>
      }
    ></AnimatePopover>
  )
})
