import { Content } from '@/components'
import { Colors } from '@/consts'
import { useEffect, useState } from 'react'
import { ipcInstance } from '@/plugins'

const MacTitlebar = () => {
  const [isFullscreen, setIsFullScreen] = useState(false)
  useEffect(() => {
    const mh = () => {
      console.log('fulsc')
      setIsFullScreen(true)
    }
    const umh = () => {
      setIsFullScreen(false)
    }
    ipcInstance.on('fullScreen', mh)
    ipcInstance.on('leaveFullScreen', umh)
    return () => {
      ipcInstance.off('fullScreen')
      ipcInstance.off('leaveFullScreen')
    }
  }, [])
  return (
    <Content
      fullWidth
      style={{
        height: isFullscreen ? 0 : 30,
        '-webkit-app-region': 'drag',
        borderBottom: `1px solid ${Colors.Background.Border}`,
        display: isFullscreen ? 'none' : 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontStyle: 'italic',
        fontWeight: 600,
        fontSize: 13
      }}
    >
      Rendevoz
    </Content>
  )
}

export default MacTitlebar
