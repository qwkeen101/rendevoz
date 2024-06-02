import { AnimatePopover, Content, Icon, Tooltip, WithBorder } from '@/components/base'
import Zindexes from '@/consts/zindex'
import ClassName from '@/styles/classNames'
import { useState } from 'react'
import GraphFilter from '../GraphFilter'
import GraphPathFilter from '../GraphPathFilter'
import GraphSetting from '../GraphSetting'
import { Colors } from '@/consts'

const GraphSettingPanel = () => {
  const [panelState, setPanelState] = useState<{
    visible?: boolean
    currentPanel?: 'info' | 'filter' | 'path filter' | 'setting'
  }>({
    currentPanel: 'info',
    visible: false
  })

  const togglePanel = (panel: (typeof panelState)['currentPanel']) => {
    setPanelState({
      currentPanel: panel,
      visible: panel === panelState.currentPanel && panelState.visible ? false : true
    })
  }
  const renderPopover = () => {
    switch (panelState.currentPanel) {
      case 'filter':
        return <GraphFilter />
      case 'path filter':
        return <GraphPathFilter />
      case 'setting':
        return <GraphSetting />
    }
  }
  return (
    <AnimatePopover
      visible={!!panelState.visible}
      padding={10}
      positions={['bottom']}
      align="start"
      onVisiblityChange={v => setPanelState(s => ({ ...s, visible: v }))}
      onClickOutside={() => setPanelState(s => ({ ...s, visible: false }))}
      withClickCover={true}
      content={<WithBorder>{renderPopover()}</WithBorder>}
    >
      <div
        style={{
          fontSize: 16,
          padding: '6px 12px',
          borderRadius: 999,
          overflow: 'hidden',
          display: 'flex',
          gap: 6,
          background: Colors.Background.Global
        }}
        className={'border-box-shadow'}
      >
        <Tooltip content="Filter">
          <Icon name="park-filter" className={'button p-6 br-6'} onClick={() => togglePanel('filter')} />
        </Tooltip>
        <Tooltip content="Path Finder">
          <Icon name="park-connection-point-two" className={'button p-6 br-6'} onClick={() => togglePanel('path filter')} />
        </Tooltip>
      </div>
    </AnimatePopover>
  )
}

export default GraphSettingPanel
