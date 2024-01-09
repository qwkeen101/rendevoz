import { Content } from '@/components'
import { Colors } from '@/consts'
import { useEffect, useState } from 'react'
import { ipcInstance } from '@/plugins'

const MacTitlebar = () => {

  return (
    <Content
      fullWidth
      style={{
        height: isFullscreen ? 0 : 30,
        WebkitAppRegion: 'drag',
        borderBottom: `1px solid ${Colors.Background.Border}`,
        display: isFullscreen ? 'none' : 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontStyle: 'italic',
        fontWeight: 600,
        fontSize: 13
      }}
    >
    </Content>
  )
}

export default MacTitlebar
