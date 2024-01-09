import { ipcInstance } from '@/plugins'
import { maximizeWindow, minimizeWindow } from '@/utils/window'
import { useEffect, useState } from 'react'
import { Content } from '../base'
import Icon from '../base/Icon'
import styles from './index.module.less'
import close from '@/api/lifycycle/close/close'

const TitleBar = () => {
  const [isFullScreen, setIsFullScreen] = useState(false)
  useEffect(() => {
    ipcInstance.on('winUnmaximized', () => {
      setIsFullScreen(false)
    })
    ipcInstance.on('winMaximized', () => {
      setIsFullScreen(true)
      console.log('yes')
    })
    return () => {
      ipcInstance.off('winMaximized')
      ipcInstance.off('winUnmaximized')
    }
  }, [])
  return (
    <Content flex alignItems="center" justifyContent="flex-end" position="fixed" gap={10} className={styles.titleBar}>
      <Icon
        className={styles.icon}
        name="park-minus"
        cursor="pointer"
        onClick={() => {
          minimizeWindow()
        }}
      />
      <Icon
        className={styles.icon}
        name={isFullScreen ? 'park-off-screen' : 'park-full-screen'}
        cursor="pointer"
        onClick={() => {
          maximizeWindow()
        }}
      />
      <Icon
        name="park-close"
        className={styles.icon}
        cursor="pointer"
        onClick={() => {
          close()
        }}
      />
    </Content>
  )
}
export default TitleBar
