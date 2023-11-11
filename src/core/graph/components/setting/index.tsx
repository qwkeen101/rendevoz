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
      closeOnClickOutside={false}
      content={<WithBorder padding={8}>{renderPopover()}</WithBorder>}
    >
      <WithBorder
        style={{
          fontSize: 16,
          padding: '3px 14px',
          borderRadius: 999,
          overflow: 'hidden',
          display: 'flex',
          gap: 10,
          background: Colors.Background.Secondary,
          boxShadow: 'none'
        }}
      >
        <Tooltip content="Graph Filter">
          <Icon name="park-filter" className={ClassName.circleButton(6, 4)} onClick={() => togglePanel('filter')} />
        </Tooltip>
        <Tooltip content="Graph Path Finder">
          <Icon name="park-connection-point-two" className={ClassName.circleButton(6, 4)} onClick={() => togglePanel('path filter')} />
        </Tooltip>
      </WithBorder>
    </AnimatePopover>
  )
}

export default GraphSettingPanel
