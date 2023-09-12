import { useIsIn, useMergedRef, useSelectAtomValue } from '@/hooks'
import useVideoState, { VideoState, VideoStateAtom } from '@/core/video/hooks/useVideoState'
import { Button, Content, Icon, IconWithPopover, Tooltip, VirtualList, WithBorder } from '@/components'
import { useVideoInstance } from '@/core/video/hooks/useVideoInstance'
import { normalizeSecondsToTime } from '@/core/video/utils'
import { ClassName } from 'rendevoz'
import { memo, useEffect, useRef, useState } from 'react'
import FontSize from '@/consts/font'
import Colors from '../../consts/colors'
import { useTranslation } from 'react-i18next'
import { Resizable } from 're-resizable'
import { useAtom } from 'jotai'
import { VideoSidebarStateAtom } from '@/core/video/hooks/useVideoSidebarState'
import { WebVTTParser } from 'webvtt-parser'
import Select from '@/components/base/select'
import { Virtualizer } from '@tanstack/react-virtual'
import { ObjectStore } from '@/stores'
import useSubtitleSelectAsLabel from '@/core/video/useSubtitleSelectAsLabel'
const SelectButton: typeof Button.IconButton = props => {
  return <Button.IconButton {...props} style={{ padding: '3px 6px', lineHeight: 1.2, fontSize: '0.957rem' }} />
}
const VideoSubtitleSidebar = memo(({ small }: { small: boolean }) => {
  const [videoState] = useVideoState()
  const { currentTime = 0, subtitleList: subtitles = [], subtitleMode = 'list', subtitleLang, subtitleFollow = true } = videoState
  const { t } = useTranslation()
  const [sidebarState, setSidebarState] = useAtom(VideoSidebarStateAtom)
  const [subtitleFile, setSubtitleFile] = useState<{
    lang: string
    subtitles: VideoState['subtitles']
  }>()
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(0)
  const { ref, isIn } = useIsIn()
  const virtualizerRef = useRef<Virtualizer>()
  useEffect(() => {
    if (currentTime && subtitleFile?.subtitles) {
      const index = subtitleFile.subtitles.findIndex(i => i.startTime <= currentTime && i.endTime >= currentTime)
      if (index >= 0) {
        setCurrentSelectedIndex(index)
      }
    } else {
      setCurrentSelectedIndex(0)
    }
  }, [currentTime, subtitleFile?.subtitles])
  useEffect(() => {
    if (subtitles.length && sidebarState.showSubtitles) {
      const targetFile = subtitleLang ? subtitles.find(i => i.lang === subtitleLang) : subtitles[0]
      if (!targetFile) {
        setSubtitleFile(undefined)
      } else {
        fetch(targetFile.url).then(file => {
          file.text().then(text => {
            const parser = new WebVTTParser()
            const tree = parser.parse(text, 'metadata')
            setSubtitleFile({ lang: subtitleLang, subtitles: tree.cues })
          })
        })
      }
    }
  }, [subtitleLang, sidebarState.showSubtitles])
  useEffect(() => {
    if (sidebarState.subtitleDisplayMode === 'list') {
      const virtualizer = virtualizerRef.current
      if (virtualizer && !isIn && subtitleFollow) {
        virtualizer.scrollToIndex(currentSelectedIndex, {
          align: 'center'
        })
      }
    }
  }, [currentSelectedIndex, subtitleMode])

  const { renderPopover, containerRef } = useSubtitleSelectAsLabel(subtitleFile?.subtitles)
  const mergedRef = useMergedRef(containerRef, ref)
  if (!subtitles.length || !subtitleFile) return null

  return (
    <Resizable
      style={{
        border: `1px solid ${Colors.Background.Border}`,
        borderRadius: 10,
        overflow: 'hidden',
        maxHeight: '100%',
        display: 'flex',
        contentVisibility: sidebarState.showSubtitles ? 'visible' : 'hidden',
        position: sidebarState.showSubtitles ? 'relative' : 'absolute',
        opacity: sidebarState.showSubtitles ? 1 : 0,
        pointerEvents: sidebarState.showSubtitles ? 'auto' : 'none',
        flexDirection: 'column',
        flex: small ? 2 : undefined
      }}
      minWidth={250}
      maxWidth={small ? '100%' : 550}
      size={{
        width: small ? '100%' : sidebarState.subtitleBarWidth,
        height: small ? 0 : 'auto'
      }}
      onResizeStop={(event, direction, elementRef, delta) => {
        setSidebarState(s => ({ ...s, subtitleBarWidth: elementRef.clientWidth }))
      }}
      onResize={(event, direction, elementRef) => {
        setSidebarState(s => ({ ...s, subtitleBarRealtimeWidth: elementRef.clientWidth }))
      }}
      enable={{
        right: !small
      }}
    >
      {renderPopover()}
      <Content
        style={{
          padding: '6px 20px 6px 16px',
          background: Colors.Background.ButtonHover
        }}
        flex
        fullWidth
        alignItems="center"
        justifyContent="space-between"
      >
        <div className={ClassName.title(FontSize['18px'])}>{t('general.subtitles')}</div>
        <IconWithPopover
          containerStyle={{
            margin: '0 20px 0 auto'
          }}
          className={ClassName.circleButton()}
          name={'park-more'}
          renderOnParent={false}
          content={
            <WithBorder padding={6} style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 180 }}>
              <div className={ClassName.description(FontSize['12px'])}>字幕样式</div>
              <SelectButton
                icon={'park-view-list'}
                text={'列表模式'}
                onClick={() => ObjectStore('video').updateOne({ id: videoState.videoId, subtitleMode: 'list' })}
              />
              <SelectButton
                icon={'park-align-text-middle-one'}
                text={'文章模式'}
                onClick={() => ObjectStore('video').updateOne({ id: videoState.videoId, subtitleMode: 'article' })}
              />
              <div className={ClassName.description(FontSize['12px'])}>字幕语言</div>
              {subtitles.map(i => (
                <SelectButton
                  onClick={() => ObjectStore('video').updateOne({ id: videoState.videoId, subtitleLang: i.lang })}
                  text={i.lang}
                  key={i.lang}
                  onSuffixIconClick={e => {
                    e.stopPropagation()
                    ObjectStore('video').updateOne({
                      id: videoState.videoId,
                      subtitleList: videoState.subtitleList?.filter(o => o.lang !== i.lang)
                    })
                  }}
                  suffixIcon={'park-delete'}
                />
              ))}
              <div style={{ width: '100%', height: 1, background: Colors.Background.Border }}></div>
              <SelectButton
                text={'字幕跟随'}
                enabled={subtitleFollow}
                onClick={() => ObjectStore('video').updateOne({ id: videoState.videoId, subtitleFollow: !subtitleFollow })}
              />
            </WithBorder>
          }
          placement={['bottom']}
        />
        <Icon
          name="park-close"
          className={ClassName.circleButton()}
          onClick={() => setSidebarState(s => ({ ...s, showSubtitles: false }))}
        ></Icon>
      </Content>
      <Content style={{ height: 0, flex: 1 }} fullWidth ref={mergedRef}>
        {subtitleMode === 'list' ? (
          <VirtualList
            style={{ width: '100%', height: '100%', padding: '6px 4px' }}
            estimateSize={30}
            items={subtitleFile.subtitles}
            overscan={30}
            ref={virtualizerRef}
            renderItem={(s, idx) => (
              <SubtitleItem currentTime={currentTime} index={idx} subtitle={s} key={s.id} selected={idx === currentSelectedIndex} />
            )}
          />
        ) : (
          <Content style={{ height: '100%', overflowY: 'auto', padding: '12px 14px' }}>
            {subtitleFile.subtitles?.map((i, idx) => (
              <ArticleSubtitleItem index={idx} scrollable={subtitleFollow && !isIn} subtitle={i} selected={idx === currentSelectedIndex} />
            ))}
          </Content>
        )}
      </Content>
    </Resizable>
  )
})

const ArticleSubtitleItem = memo(
  ({
    subtitle,
    selected,
    scrollable,
    index
  }: {
    subtitle: Required<VideoState>['subtitles'][0]
    selected: boolean
    scrollable: boolean
    index: number
  }) => {
    const ref = useRef<HTMLSpanElement>(null)
    const instance = useVideoInstance()
    useEffect(() => {
      if (selected && scrollable && ref.current) {
        const currentParent = ref.current.parentElement!
        currentParent.scrollTop = ref.current.offsetTop - currentParent.clientHeight / 2
        ref.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
      }
    }, [selected])
    return (
      <span
        data-subtitle-index={index}
        className={ClassName.flatButton(4, '0px')}
        style={{
          paddingLeft: 6,
          borderRadius: 4,
          background: selected ? Colors.Common.SelectColorTransparent : undefined,
          userSelect: 'text'
        }}
        ref={ref}
        onClick={() => {
          if (window.getSelection()?.isCollapsed) {
            instance.jumpTo?.(subtitle.startTime)
          }
        }}
      >
        {subtitle.text}
      </span>
    )
  }
)

const SubtitleItem = memo(
  ({ subtitle, selected, index }: { subtitle: Required<VideoState>['subtitles'][0]; selected: boolean; index: number }) => {
    const instance = useVideoInstance()
    const [hovered, setHovered] = useState(false)
    return (
      <Content
        flex
        data-subtitle-index={index}
        justifyContent="space-between"
        className={ClassName.flatButton()}
        onPointerLeave={() => setHovered(false)}
        onPointerMove={() => setHovered(true)}
        onClick={() => {
          if (window.getSelection()?.isCollapsed) {
            instance.jumpTo?.(subtitle.startTime)
          }
        }}
        style={{
          background: selected ? Colors.Common.SelectColorTransparent : undefined
        }}
        alignItems="center"
      >
        <Content flex gap={10} alignItems={'center'}>
          <div className={ClassName.description(FontSize['11px'])} style={{ lineHeight: 1, userSelect: 'none' }}>
            {normalizeSecondsToTime(subtitle.startTime)}
          </div>
          <div style={{ userSelect: 'text', fontSize: FontSize['13px'] }}>{subtitle.text}</div>
        </Content>
        <Tooltip content={'Add as label'}>
          <Icon
            name="park-plus"
            containerStyle={{ flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
            className={ClassName.circleButton()}
            onClick={() => {
              instance.insertLabel?.(
                {
                  videoTime: subtitle.startTime,
                  name: subtitle.text
                },
                false
              )
            }}
          />
        </Tooltip>
      </Content>
    )
  }
)

export default VideoSubtitleSidebar
