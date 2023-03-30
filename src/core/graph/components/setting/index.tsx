import { AnimatePopover, Content, Icon, Tooltip } from '@/components/base'
import Zindexes from '@/consts/zindex'
import ClassName from '@/styles/classNames'
import { useState } from 'react'
import GraphFilter from '../GraphFilter'

const GraphSettingPanel = () => {
  const [panelState, setPanelState] = useState<{
    visible?: boolean
    currentPanel?: 'info' | 'filter'
  }>({
    currentPanel: 'info',
    visible: false
  })

  const togglePanel = (panel: typeof panelState['currentPanel']) => {
    setPanelState({
      currentPanel: panel,
      visible: !panelState.visible
    })
  }
  const renderPopover = () => {
    switch (panelState.currentPanel) {
      case 'filter':
        return <GraphFilter />
    }
  }
  return (
    <AnimatePopover
      containerStyle={{
        zIndex: String(Zindexes.Tooltip)
      }}
      visible={!!panelState.visible}
      padding={10}
      positions={['left']}
      align="start"
      content={
        <div
          style={{
            border: '1px solid rgba(31,34,39,0.08)',
            borderRadius: 6,
            position: 'relative'
          }}
        >
          {renderPopover()}
        </div>
      }
    >
      <Content
        flex
        column
        gap={8}
        style={{ fontSize: 16, padding: '10px 6px', borderRadius: 8, overflow: 'hidden' }}
        className={ClassName.Background.pseudoBlubBackground}
      >
        <Tooltip content="Graph Filter">
          <Icon name="park-filter" className={ClassName.circleButton()} onClick={() => togglePanel('filter')} />
        </Tooltip>
      </Content>
    </AnimatePopover>
  )
}

export default GraphSettingPanel
