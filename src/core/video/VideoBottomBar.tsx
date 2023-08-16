import { AnimatePopover, Button, Content, Icon, IconWithPopover, Slider, WithBorder } from '@/components'
import { useVideoInstance } from './hooks/useVideoInstance'
import useVideoState from './hooks/useVideoState'
import { useMemo, useRef } from 'react'
import { css } from '@emotion/css'
import VideoChapter from './VideoChapter'
import { AnimatePresence, motion } from 'framer-motion'
import { normalizeSecondsToTime } from './utils'
import ClassName from '@/styles/classNames'
import useVideoToolbarState from './hooks/useVideoToolbarState'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import VideoProgressLabelPin from './VideoProgressLabelPin'
import VideoScrubber from './VideoScrubber'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '../rendevoz'
import { MetaStore, ObjectStore } from '@/stores'
import { saveImageLocally } from '@/utils/img'
import { useSetAtom } from 'jotai'
import { VideoSidebarStateAtom } from './hooks/useVideoSidebarState'

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
const VideoBottomBar = () => {
  const instance = useVideoInstance()
  const [videoState, setVideoState] = useVideoState()
  const [toolbarState, setToolbarState] = useVideoToolbarState()
  const setSidebarState = useSetAtom(VideoSidebarStateAtom)
  const { totalTime = 0, currentTime = 0, paused, volume, muted } = videoState
  const { showVolume, chooseTime, thumbnailUrl, thumbnailVisible, thumbnailPosition, currentHoverTime, draggingScrubber } = toolbarState
  const { currDuration, totalDuration, percent, currentChapter } = useMemo(() => {
    setToolbarState(s => (s.draggingScrubber ? s : { ...s, currentScrubberTime: currentTime }))
    const currentChapter = videoState.sortedChapters?.findLast(i => i.startTime < currentTime)
    return {
      currDuration: normalizeSecondsToTime(currentTime),
      totalDuration: normalizeSecondsToTime(totalTime),
      percent: (currentTime || 0) / (totalTime || 0),
      currentChapter
    }
  }, [totalTime, currentTime])

  const containerRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  return (
    <Content
      flex
      column
      ref={containerRef}
      style={{
        opacity: toolbarState.visible || chooseTime || toolbarState.currentHoverLabelId || paused || draggingScrubber ? 1 : 0
      }}
      className={css({
        transition: 'opacity 0.3s ease',
        '*': {
          color: Colors.Font.White,
          '--button-hover-background': 'rgba(255,255,255,0.2)'
        },
        '.react-tiny-popover-container': {
          '--linear-background': Colors.Background.DarkLinear
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
      <AnimatePopover
        disableNudge
        backdropFilter={false}
        containerStyle={{
          pointerEvents: 'none'
        }}
        parentElement={containerRef.current}
        content={
          <Content flex column alignItems="center">
            <img width={200} src={thumbnailUrl} style={{ borderRadius: 10 }} />

            <Content
              flex
              column
              alignItems="center"
              style={{
                fontSize: FontSize['12px'],
                textShadow: '0 0 4px rgba(0,0,0,0.75)',
                padding: '5px 9px',
                color: Colors.Font.White,
                lineHeight: 1.3
              }}
            >
              {toolbarState.thumbnailLabelName && (
                <Content flex alignItems="center" gap={6}>
                  <Icon name="park-pin" fill="#FFE7A0" size={12} />
                  <div
                    style={{
                      maxWidth: 160,
                      color: Colors.Emphasis.DarkEmphasis
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
        {videoState.labels?.map(i => (
          <VideoProgressLabelPin labelId={i} key={i} />
        ))}
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
          {videoState.sortedChapters?.length ? (
            videoState.sortedChapters.map((i, idx, arr) => {
              const next = arr[idx + 1]
              const endTime = next ? next.startTime : totalTime
              const duration = endTime - i.startTime
              return (
                <VideoChapter chapter={i} idx={idx} key={i.id} startTime={i.startTime} endTime={endTime} percent={duration / totalTime} />
              )
            })
          ) : (
            <VideoChapter idx={0} startTime={0} endTime={totalTime} percent={1} />
          )}
        </div>
        <VideoScrubber />
      </div>
      <Content
        style={{ height: 44, padding: '0px 12px' }}
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
                  max={0.6}
                  step={0.02}
                />
              </motion.div>
            )}
          </AnimatePresence>
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
        </Content>
        <Content flex fullHeight alignItems="center" role="right-toolbar" gap={16} style={{ flexShrink: 0 }}>
          {videoState.subtitleUrl && (
            <Icon
              onClick={() => {
                setVideoState(s => ({ ...s, showSubtitle: !s.showSubtitle }))
              }}
              size={16}
              data-pressed={!!videoState.showSubtitle}
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
          )}
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
                    selected={videoState.speed === i ? true : undefined}
                    key={i}
                    style={{
                      textAlign: 'center',
                      fontWeight: 600,
                      width: '100%',
                      fontSize: FontSize['13px'],
                      padding: '2px 6px'
                    }}
                    onClick={() => {
                      setVideoState(s => ({ ...s, speed: i }))
                      setState(false)
                    }}
                  ></Button.IconButton>
                ))}
              </WithBorder>
            )}
          >
            <div style={{ fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>{videoState.speed}X</div>
          </AnimatePopover>
          <IconWithPopover
            padding={0}
            renderOnParent={false}
            content={setState => (
              <WithBorder onClick={e => Rendevoz.Events.DOM.hasButton(e) && setState(false)} padding={8} style={{ borderRadius: 8 }}>
                <Button.IconButton
                  icon="park-down-picture"
                  text={t('general.Download screenshot')}
                  onClick={() => {
                    const videoMeta = videoState.videoId ? MetaStore.getMetaObjectByObjectId(videoState.videoId) : undefined
                    if (!videoMeta) return
                    instance.captureCurrentImage?.().then(res => {
                      if (res) {
                        const a = document.createElement('a')
                        a.href = res
                        a.download = `${videoMeta.name}_${normalizeSecondsToTime(currentTime)}.png`
                        a.click()
                      }
                    })
                  }}
                />
                <Button.IconButton
                  icon="park-screenshot"
                  onClick={() => {
                    instance.captureImage?.(currentTime, { width: 1600, height: 900 }).then(data => {
                      if (data) {
                        const videoMeta = videoState.videoId ? MetaStore.getMetaObjectByObjectId(videoState.videoId) : undefined
                        saveImageLocally(data, { compress: false }).then(res => {
                          ObjectStore('image').addOneWithMeta(
                            {
                              imageUrl: res
                            },
                            {
                              showMetaModal: false,
                              currentMeta: {
                                name: 'Video screenshot',
                                coverImgSrc: res,
                                fromObject: videoMeta
                                  ? {
                                      metaId: videoMeta.id,
                                      type: 'video',
                                      time: currentTime
                                    }
                                  : undefined
                              }
                            }
                          )
                        })
                      }
                    })
                  }}
                  text={t('general.add screenshot')}
                ></Button.IconButton>
                <Button.IconButton
                  onClick={() => {
                    instance.insertChapter?.({
                      startTime: currentTime,
                      name: 'Untitled Chapter'
                    })
                  }}
                  text={t('general.add chapter')}
                  icon="park-link"
                ></Button.IconButton>
                <Button.IconButton
                  icon="park-pin"
                  onClick={() => {
                    instance.insertLabel?.({
                      videoTime: currentTime,
                      name: 'Unnamed Label'
                    })
                  }}
                  text={t('general.add label')}
                ></Button.IconButton>
              </WithBorder>
            )}
            name="park-plus"
            className={ClassName.circleButton()}
            strokeWidth={6}
          ></IconWithPopover>
        </Content>
      </Content>
    </Content>
  )
}

export default VideoBottomBar
