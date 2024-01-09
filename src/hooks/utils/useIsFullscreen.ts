import { useEffect, useState } from 'react'
import { ipcInstance } from '@/plugins'

export default (app = true) => {
  const [isFullscreen, setIsFullscreen] = useState(document.fullscreenElement !== null)
  useEffect(() => {
    if (app) {
      const mh = () => {
        setIsFullscreen(true)
      }
      const umh = () => {
        setIsFullscreen(false)
      }
      ipcInstance.on('fullScreen', mh)
      ipcInstance.on('leaveFullScreen', umh)
      ipcInstance.send('isFullScreen').then(res => {
        setIsFullscreen(res.data)
      })
      return () => {
        ipcInstance.off('fullScreen')
        ipcInstance.off('leaveFullScreen')
      }
    } else {
      const handler = () => {
        if (document.fullscreenElement) {
          setIsFullscreen(true)
        } else {
          setIsFullscreen(false)
        }
      }
      document.addEventListener('fullscreenchange', handler)
      return () => {
        document.removeEventListener('fullscreenchange', handler)
      }
    }
  }, [])
  return isFullscreen
}
