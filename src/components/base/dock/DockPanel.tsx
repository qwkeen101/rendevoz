import React, { memo, useContext, useRef } from 'react'
import { DockContextType, LayoutData, PanelData } from './DockData'
import { DockTabs, ShowInPanelDragEdgeAtom } from './DockTabs'
import { DragDropDiv } from './dragdrop/DragDropDiv'
import { DragState } from './dragdrop/DragManager'
import { DockDropEdge } from './DockDropEdge'
import { useAtomValue } from 'jotai'

// todo: add drop from panel
export default memo(({ panelData, size }: { panelData: PanelData; size: number }) => {
  const context = useContext(DockContextType)
  const ref = useRef<HTMLDivElement>(null)
  const showEdge = useAtomValue(ShowInPanelDragEdgeAtom)
  const onClick = () => {
    const layout = context.getLayout()
    if (panelData.id !== layout.global.currentFocusedPanelId) {
      const newLayout: LayoutData = {
        ...layout,
        global: {
          ...layout.global,
          currentFocusedPanelId: panelData.id
        }
      }
      context.setLayout(newLayout)
      context.onSilentChange()
    }
  }
  const { id } = panelData
  const cls = 'dock-panel'
  let flex = 1
  const flexGrow = flex * size
  let flexShrink = flex * 1000000
  if (flexShrink < 1) {
    flexShrink = 1
  }
  const style: React.CSSProperties = {
    flex: `${flexGrow} ${flexShrink} ${size}px`
  }
  let droppingLayer: React.ReactNode
  const ele = ref.current
  if (ele) {
    const dockId = context.getDockId()
    if (showEdge && DragState.getData('tab', dockId) !== null) {
      droppingLayer = <DockDropEdge panelData={panelData} panelElement={ele} />
    }
  }

  return (
    <DragDropDiv onClick={onClick} ref={ref} className={cls} style={style} data-dockid={id}>
      <DockTabs panelData={panelData} />
      {droppingLayer}
    </DragDropDiv>
  )
})
