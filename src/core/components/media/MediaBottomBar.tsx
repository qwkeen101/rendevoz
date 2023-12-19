import { AnimatePopover, Button, Content, Icon, IconWithPopover, Slider, WithBorder } from '@/components'
import { useMediaInstance } from './hooks/useMediaInstance'
import useMediaState from './hooks/useMediaState'
import { useMemo, useRef } from 'react'
import { css } from '@emotion/css'
import MediaChapter from './components/sidebar/MediaChapter'
import { AnimatePresence, motion } from 'framer-motion'
import { normalizeSecondsToTime } from './utils'
import ClassName from '@/styles/classNames'
import useMediaToolbarState from './hooks/useMediaToolbarState'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import MediaProgressLabelPin from './MediaProgressLabelPin'
import MediaScrubber from './components/MediaScrubber'
import { useSetAtom } from 'jotai'
import { VideoSidebarStateAtom } from './hooks/useMediaSidebarState'
import MediaActionsMenu from '@/core/components/media/components/MediaActionsMenu'

const playerControlMask = css({
  backgroundImage:
    'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAEgCAYAAAB1khmuAAAAAXNSR0IArs4c6QAAATNJREFUOE9tyPdHJ3AAh/Fve++9995d1957iySSRBJJIokkkRznJM45kkQS6Y/M0y8PH71/ePG8I5HvF8Ut0aTEkBJLShwp8WRAAp8kkpJESjIpKaSkkgFpfJJOSgYpmaRkkZJNBuTwSS4peaTkk1JASiEZUMQnxaSUkFJKShkp5WRABZ9UklJFSjUpNaTUkgF1fFJPSgMpjaQ0kQHNfNJCSispbaS0k9JBBnTySRcp3aT8IKWHlJ9kQC+f9JHST8oAKYOkDJEBw3wyQsooKWOkjJMyQQZM8skUKdOkzJAyS8ocGTDPJwukLJKyRMoyKSvkF6uwBuuwAZuwBduwA7uwB/twAIdwBMdwAqdwBudwAZdwBddwA7fwC37DH7iDe/gL/+A/PMAjPMEzvMArvME7fHwCb3Y5NUwXcu0AAAAASUVORK5CYII=")',
  bottom: 0,
  position: 'absolute',
  pointerEvents: 'none',
  left: 0,
  backgroundPosition: 'bottom',
  backgroundRepeat: 'repeat-x',
  width: '100%',
  height: 288,
  borderRadius: '0px 0px 12px 12px'
})
const playSpeed: number[] = [2, 1.5, 1.25, 1, 0.75, 0.5]
const MediaBottomBar = () => {
  const [mediaState, setMediaState] = useMediaState()
  const [toolbarState, setToolbarState] = useMediaToolbarState()
  const setSidebarState = useSetAtom(VideoSidebarStateAtom)
  const { totalTime = 0, currentTime = 0, paused, volume, muted, mode, floated } = mediaState
  const { showVolume, chooseTime, thumbnailUrl, thumbnailVisible, thumbnailPosition, currentHoverTime, draggingScrubber } = toolbarState
  const { currDuration, totalDuration, currentChapter } = useMemo(() => {
    setToolbarState(s => (s.draggingScrubber ? s : { ...s, currentScrubberTime: currentTime }))
    const currentChapter = mediaState.sortedChapters?.findLast(i => i.startTime < currentTime)
    return {
      currDuration: normalizeSecondsToTime(currentTime),
      totalDuration: normalizeSecondsToTime(totalTime),
      percent: (currentTime || 0) / (totalTime || 0),
      currentChapter
    }
  }, [totalTime, currentTime])
  const audioMode = mode === 'audio'
  const containerRef = useRef<HTMLDivElement>(null)
  const opacity = audioMode || toolbarState.visible || chooseTime || toolbarState.currentHoverLabelId || paused || draggingScrubber ? 1 : 0
  return (
    <Content
      flex
      column
      ref={containerRef}
      style={{
        opacity
      }}
      className={css([
        {
          transition: 'opacity 0.3s ease',
          '.hover-progress, .load-progress': {
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            transformOrigin: '0 0'
          }
        },
        mediaState.mode !== 'audio' && {
          '*': {
            color: Colors.Font.White,
            '--button-hover-background': 'rgba(255,255,255,0.2)'
          },
          '.react-tiny-popover-container': {
            '--linear-background': Colors.Background.DarkLinear
          }
        }
      ])}
    >
      {!audioMode && <div role="player-control-mask" className={playerControlMask}></div>}
      <AnimatePopover
        disableNudge
        backdropFilter={false}
        containerStyle={{
          pointerEvents: 'none',
          zIndex: '500'
        }}
        content={
          <Content flex column alignItems="center" style={{ opacity }}>
            <img width={200} src={thumbnailUrl} style={{ borderRadius: 10 }} />
            <Content
              flex
              column
              alignItems="center"
              style={{
                fontSize: FontSize['12px'],
                textShadow: '0 0 4px rgba(0,0,0,0.45)',
                padding: '5px 9px',
                color: mediaState.mode === 'audio' ? Colors.Font.Transparent : Colors.Font.White,
                lineHeight: 1.3
              }}
            >
              {toolbarState.thumbnailLabelName && (
                <Content flex alignItems="center" gap={6}>
                  <div
                    style={{
                      maxWidth: 160,
                      color: Colors.Common.SelectColor
                    }}
                    className={ClassName.ellipsisFont(1)}
                  >
                    {toolbarState.thumbnailLabelName}
                  </div>
                </Content>
              )}
              {toolbarState.thumbnailChapterName && (
                <div
                  className={ClassName.ellipsisFont(2)}
                  style={{
                    maxWidth: 160
                  }}
                >
                  {toolbarState.thumbnailChapterName}
                </div>
              )}
              <div>{normalizeSecondsToTime(currentHoverTime || 0)}</div>
            </Content>
          </Content>
        }
        visible={thumbnailVisible}
        position={{
          left: thumbnailPosition?.x,
          top: thumbnailPosition?.y
        }}
        positions={['top']}
      ></AnimatePopover>
      <div
        role="video-process-marker"
        className={css({
          transformOrigin: '0 0',
          height: 5,
          width: '100%',
          zIndex: 20,
          display: 'flex',
          position: 'relative'
        })}
      >
        {mediaState.labels?.map(i => <MediaProgressLabelPin labelId={i} key={i} />)}
        <div
          style={{ width: '100%', height: '100%', display: 'flex' }}
          className={css({
            '> div': {
              ':not(:last-child)': {
                paddingRight: 3
              }
            }
          })}
        >
          {mediaState.sortedChapters?.length ? (
            mediaState.sortedChapters.map((i, idx, arr) => {
              const next = arr[idx + 1]
              const endTime = next ? next.startTime : totalTime
              const duration = endTime - i.startTime
              return (
                <MediaChapter chapter={i} idx={idx} key={i.id} startTime={i.startTime} endTime={endTime} percent={duration / totalTime} />
              )
            })
          ) : (
            <MediaChapter idx={0} startTime={0} endTime={totalTime} percent={1} />
          )}
        </div>
        <MediaScrubber />
      </div>
      <Content
        style={{
          height: audioMode ? 55 : 44,
          padding: audioMode ? 0 : '0px 12px',
          margin: audioMode ? '0px -6px' : undefined
        }}
        flex
        justifyContent="space-between"
        alignItems="center"
        onPointerLeave={() => setToolbarState(s => ({ ...s, showVolume: false }))}
      >
        <Content
          style={{ flexShrink: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}
          flex
          fullHeight
          alignItems="center"
          role="left-toolbar"
        >
          <Icon
            className={ClassName.circleButton()}
            size={20}
            strokeWidth={8}
            name={paused ? 'park-play-one' : 'park-pause'}
            onClick={() => {
              setMediaState(s => ({ ...s, paused: !s.paused }))
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
            onClick={() => setMediaState(s => ({ ...s, muted: !s.muted }))}
            name={volume === 0 || muted ? 'park-volume-mute' : volume < 0.3 ? 'park-volume-small' : 'park-volume-notice'}
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
                    backgroundColor: mediaState.mode === 'audio' ? Colors.Font.Primary : Colors.Font.White
                  }}
                  trackStyle={{
                    backgroundColor: mediaState.mode === 'audio' ? Colors.Font.Primary : Colors.Font.White
                  }}
                  railStyle={{
                    backgroundColor: mediaState.mode === 'audio' ? Colors.Background.ButtonHover : Colors.Background.DarkButtonHover
                  }}
                  value={muted ? 0 : volume}
                  onChange={v => typeof v === 'number' && setMediaState(s => ({ ...s, volume: v, muted: false }))}
                  min={0}
                  max={0.6}
                  step={0.02}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {mediaState.loaded ? (
            <Content
              gap={6}
              flex
              alignItems="center"
              className={ClassName.description(FontSize['12px'])}
              style={{ marginLeft: 6, flexShrink: 1, overflow: 'hidden' }}
            >
              <div>
                {currDuration} / {totalDuration}
              </div>
              {currentChapter && (
                <>
                  <div style={{ fontSize: 9 }}>•</div>
                  <div style={{ cursor: 'pointer' }} onClick={() => setSidebarState(s => ({ ...s, showChapters: true }))}>
                    {currentChapter.name}
                  </div>
                </>
              )}
            </Content>
          ) : (
            <Content flex gap={10} style={{ fontWeight: 600 }}>
              <Icon name={'park-loading-four'} spin />
              <div>Loading...</div>
            </Content>
          )}
        </Content>
        <Content flex fullHeight alignItems="center" role="right-toolbar" gap={16} style={{ flexShrink: 0 }}>
          {mediaState.subtitleList?.length ? (
            <Icon
              onClick={() => {
                setMediaState(s => ({ ...s, showSubtitle: !s.showSubtitle }))
              }}
              size={16}
              data-pressed={!!mediaState.showSubtitle}
              className={css({
                cursor: 'pointer',
                position: 'relative',
                ':after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -4,
                  borderRadius: 3,
                  height: 2,
                  left: -2,
                  width: 0,
                  background: Colors.Font.White,
                  transition: 'all 0.2s ease'
                },
                "&[data-pressed='true']": {
                  ':after': {
                    width: 'calc(100% + 4px)'
                  }
                }
              })}
              name="custom-CC"
            />
          ) : null}
          <AnimatePopover
            padding={10}
            content={setState => (
              <WithBorder
                className={css({
                  width: 140,
                  padding: 8,
                  display: 'flex',
                  gap: 4,
                  flexDirection: 'column',
                  alignItems: 'center'
                })}
              >
                <div className={ClassName.description(FontSize['12px'])}>Playback Speed</div>
                {playSpeed.map(i => (
                  <Button.IconButton
                    text={`${i}`}
                    selected={mediaState.speed === i ? true : undefined}
                    key={i}
                    style={{
                      textAlign: 'center',
                      fontWeight: 600,
                      width: '100%',
                      fontSize: FontSize['13px'],
                      padding: '2px 6px'
                    }}
                    onClick={() => {
                      setMediaState(s => ({ ...s, speed: i }))
                      setState(false)
                    }}
                  ></Button.IconButton>
                ))}
              </WithBorder>
            )}
          >
            <div style={{ fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>{mediaState.speed}X</div>
          </AnimatePopover>
          <IconWithPopover
            padding={0}
            renderOnParent={false}
            content={setState => <MediaActionsMenu onClose={() => setState(false)} />}
            name="park-tool"
            className={ClassName.circleButton()}
          ></IconWithPopover>
        </Content>
      </Content>
    </Content>
  )
}

export default MediaBottomBar
