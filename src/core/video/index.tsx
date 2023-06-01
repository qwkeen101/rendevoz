import { Content, Icon } from '@/components'
import { useVideoInstance } from './hooks/useVideoInstance'
import { useMemo, useState } from 'react'
import { Provider, createStore } from 'jotai'
import VideoCore from './VideoCore'
import VideoBottomBar from './VideoBottomBar'
import { css } from '@emotion/css'
import useVideoToolbarState from './hooks/useVideoToolbarState'
import useVideoState from './hooks/useVideoState'
import { useUpdateEffect } from '@/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import Colors from '@/consts/colors'

const VideoInner = () => {
  const videoInstance = useVideoInstance()
  const [playIconVisible, setPlayIconVisible] = useState(false)
  const [, setToolbarState] = useVideoToolbarState()
  const [videoState] = useVideoState()

  useUpdateEffect(() => {
    setPlayIconVisible(true)
  }, [videoState.paused])
  return (
    <Content
      onPointerMove={e => {
        setToolbarState(s => {
          if (s.visible) return s
          else return { ...s, visible: true }
        })
      }}
      onPointerLeave={e => {
        setToolbarState(s => ({ ...s, visible: false }))
      }}
    >
      <AnimatePresence>
        {playIconVisible && (
          <motion.div
            initial={{ opacity: 0.8, scale: 1, x: '-50%', y: '-50%' }}
            animate={{ opacity: 0, scale: 1.3, x: '-50%', y: '-50%' }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translateX(-50%); translateY(-50%)'
            }}
            transition={{ duration: 0.6 }}
            onAnimationComplete={() => setPlayIconVisible(false)}
          >
            <Icon
              fill={Colors.Font.White}
              size={40}
              theme="filled"
              containerStyle={{
                background: 'rgba(0,0,0,0.36)',
                borderRadius: 999,
                padding: 14
              }}
              name={videoState.paused ? 'park-pause' : 'park-play-one'}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <VideoCore url="file:///Users/realrong/Desktop/template.flv"></VideoCore>
      {/* <webview src="//player.bilibili.com/player.html?aid=800358643&bvid=BV1Gy4y1q79F&cid=256363359&page=1"></webview> */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0
        }}
      >
        <VideoBottomBar />
      </div>
    </Content>
  )
}

const Video = () => {
  const store = useMemo(() => createStore(), [])
  return (
    <Provider store={store}>
      <VideoInner />
    </Provider>
  )
}
export default Video
