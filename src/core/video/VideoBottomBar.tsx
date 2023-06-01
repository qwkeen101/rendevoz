import { Content, Icon, Slider } from '@/components'
import { useVideoInstance } from './hooks/useVideoInstance'
import useVideoState from './hooks/useVideoState'
import { intervalToDuration } from 'date-fns'
import { useMemo, useState } from 'react'
import { css } from '@emotion/css'
import VideoChapter from './VideoChapter'
import { AnimatePresence, motion } from 'framer-motion'
import { normalizeSecondsToTime } from './utils'
import ClassName from '@/styles/classNames'
import useVideoToolbarState from './hooks/useVideoToolbarState'
import Colors from '@/consts/colors'

const playerControlMask = css({
  background:
    'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg==) repeat-x bottom',
  bottom: 0,
  position: 'absolute',
  pointerEvents: 'none',
  left: 0,
  width: '100%',
  height: 100
})
const VideoBottomBar = () => {
  const instance = useVideoInstance()
  const [videoState, setVideoState] = useVideoState()
  const [toolbarState, setToolbarState] = useVideoToolbarState()
  const { totalTime = 0, currentTime = 0, url, progressbarHovering, paused, volume, muted } = videoState
  const { showVolume } = toolbarState
  const { currDuration, totalDuration, percent } = useMemo(() => {
    return {
      currDuration: normalizeSecondsToTime(currentTime),
      totalDuration: normalizeSecondsToTime(totalTime),
      percent: (currentTime || 0) / (totalTime || 0)
    }
  }, [totalTime, currentTime])

  return (
    <Content
      flex
      column
      style={{ opacity: toolbarState.visible || paused ? 1 : 0 }}
      className={css({
        transition: 'opacity 0.3s ease',
        '*': {
          color: Colors.Font.White
        },
        '.hover-progress, .load-progress': {
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          transformOrigin: '0 0'
        }
      })}
    >
      <div role="player-control-mask" className={playerControlMask}></div>
      <div
        role="video-process-marker"
        className={css({
          transformOrigin: '0 0',
          height: 5,
          width: '100%'
        })}
      >
        <VideoChapter startTime={0} endTime={totalTime} loadPercent={currentTime / totalTime} percent={1} />
      </div>
      <Content
        style={{ height: 48, padding: '0px 12px' }}
        flex
        alignItems="center"
        onPointerLeave={() => setToolbarState(s => ({ ...s, showVolume: false }))}
      >
        <Icon
          className={ClassName.circleButton()}
          size={20}
          name={paused ? 'park-play-one' : 'park-pause'}
          onClick={() => {
            setVideoState(s => ({ ...s, paused: !s.paused }))
          }}
          style={{ marginRight: 10 }}
          theme="filled"
        />
        <Icon
          className={ClassName.circleButton()}
          size={20}
          onPointerMove={() => {
            setToolbarState(s => ({ ...s, showVolume: true }))
          }}
          style={{ marginRight: 10 }}
          onClick={() => setVideoState(s => ({ ...s, muted: !s.muted }))}
          name={volume === 0 || muted ? 'park-volume-mute' : volume < 0.5 ? 'park-volume-small' : 'park-volume-notice'}
        />
        <AnimatePresence>
          {showVolume && (
            <motion.div
              initial={{ width: 0, opacity: 0, marginRight: 0 }}
              animate={{ width: 72, opacity: 1, marginRight: 10 }}
              exit={{ width: 0, opacity: 0, marginRight: 0 }}
            >
              <Slider
                handleStyle={{
                  backgroundColor: Colors.Font.White
                }}
                trackStyle={{
                  backgroundColor: Colors.Font.White
                }}
                railStyle={{
                  backgroundColor: Colors.Background.DarkButtonHover
                }}
                value={muted ? 0 : volume}
                onChange={v => typeof v === 'number' && setVideoState(s => ({ ...s, volume: v, muted: false }))}
                min={0}
                max={1}
                step={0.02}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className={ClassName.description()} style={{ marginLeft: 6 }}>
          {currDuration} / {totalDuration}
        </div>
      </Content>
    </Content>
  )
}

export default VideoBottomBar
