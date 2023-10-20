import { useIsIn, useMergedRef } from '@/hooks'
import useMediaState, { IMediaState } from '@/core/media/hooks/useMediaState'
import { Button, Content, Icon, IconWithPopover, Tooltip, VirtualList, WithBorder } from '@/components'
import { useMediaInstance } from '@/core/media/hooks/useMediaInstance'
import { normalizeSecondsToTime } from '@/core/media/utils'
import { ClassName } from 'rendevoz'
import { memo, useEffect, useRef, useState } from 'react'
import FontSize from '@/consts/font'
import Colors from '../../../../consts/colors'
import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'
import { VideoSidebarStateAtom } from '@/core/media/hooks/useMediaSidebarState'
import { WebVTTParser } from 'webvtt-parser'
import { Virtualizer } from '@tanstack/react-virtual'
import useSubtitleSelectAsLabel from '@/core/media/hooks/useSubtitleSelectAsLabel'
const SelectButton: typeof Button.IconButton = props => {
  return <Button.IconButton {...props} style={{ padding: '3px 6px', lineHeight: 1.2, fontSize: '0.957rem' }} />
}
const MediaSubtitleSidebar = memo(() => {
  const [mediaState, setMediaState] = useMediaState()
  const {
    currentTime = 0,
    subtitles: currentSubtitles = [],
    subtitleList: subtitles = [],
    subtitleMode = 'list',
    subtitleLang,
    subtitleFollow = true
  } = mediaState
  const { t } = useTranslation()
  const [sidebarState, setSidebarState] = useAtom(VideoSidebarStateAtom)
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(0)
  const { ref, isIn } = useIsIn()
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  useEffect(() => {
    if (currentTime && currentSubtitles) {
      const index = currentSubtitles.findIndex(i => i.startTime <= currentTime && i.endTime >= currentTime)
      if (index >= 0) {
        setCurrentSelectedIndex(index)
      }
    } else {
      setCurrentSelectedIndex(0)
    }
  }, [currentTime, currentSubtitles])
  useEffect(() => {
    if (subtitles.length) {
      console.log(subtitles, subtitleLang)
      const targetFile = subtitleLang ? subtitles.find(i => i.lang === subtitleLang) : subtitles[0]
      if (!targetFile) {
        setMediaState(s => ({ ...s, subtitles: undefined }))
      } else {
        fetch(targetFile.url).then(file => {
          file.text().then(text => {
            const parser = new WebVTTParser()
            const tree = parser.parse(text, 'metadata')
            console.log(tree)
            setMediaState(s => ({ ...s, subtitles: tree.cues, subtitleLang: subtitleLang || subtitles[0].lang }))
          })
        })
      }
    }
  }, [subtitleLang])
  useEffect(() => {
    if (subtitleMode === 'list') {
      const virtualizer = virtualizerRef.current
      if (virtualizer && !isIn && subtitleFollow) {
        setTimeout(() =>
          virtualizer.scrollToIndex(currentSelectedIndex, {
            align: 'center'
          })
        )
      }
    }
  }, [currentSelectedIndex, subtitleMode])
  const instance = useMediaInstance()
  const { renderPopover, containerRef } = useSubtitleSelectAsLabel(currentSubtitles)
  const mergedRef = useMergedRef(containerRef, ref)
  console.log(currentSubtitles, subtitles)
  if (!currentSubtitles.length && !subtitles.length)
    return (
      <Content flex centered fullWidth fullHeight style={{ minHeight: 240 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>No subtitle imported</div>
      </Content>
    )
  return (
    <Content fullWidth fullHeight style={{ minHeight: 240, paddingLeft: 8 }} flex column>
      {renderPopover()}
      <Content flex gap={20} style={{ margin: '6px 0px' }}>
        <div style={{ fontWeight: 600 }}>Current subtitle: {subtitleLang || 'Unselected'}</div>
        <IconWithPopover
          className={ClassName.circleButton()}
          name={'park-more'}
          renderOnParent={false}
          content={
            <WithBorder padding={6} style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 180 }}>
              <div className={ClassName.description(FontSize['12px'])}>字幕样式</div>
              <SelectButton
                icon={'park-view-list'}
                text={'列表模式'}
                onClick={() => instance.on?.({ type: 'subtitleUpdated', subtitleMode: 'list' })}
              />
              <SelectButton
                icon={'park-align-text-middle-one'}
                text={'文章模式'}
                onClick={() => instance.on?.({ type: 'subtitleUpdated', subtitleMode: 'article' })}
              />
              <div className={ClassName.description(FontSize['12px'])}>字幕语言</div>
              {subtitles.map((i, index) => (
                <SelectButton
                  onClick={() => {
                    instance.on?.({ type: 'subtitleUpdated', subtitleLang: i.lang })
                  }}
                  text={i.lang}
                  key={i.lang}
                  onSuffixIconClick={e => {
                    e.stopPropagation()
                    subtitles.splice(index, 1)
                    instance.on?.({ type: 'subtitleUpdated', subtitleList: [...subtitles] })
                  }}
                  suffixIcon={'park-delete'}
                />
              ))}
              <div style={{ width: '100%', height: 1, background: Colors.Background.Border }}></div>
              <SelectButton
                text={'字幕跟随'}
                enabled={subtitleFollow}
                onClick={() => instance.on?.({ type: 'subtitleUpdated', subtitleFollow: !mediaState.subtitleFollow })}
              />
            </WithBorder>
          }
          placement={['bottom']}
        />
      </Content>
      <Content fullHeight fullWidth ref={mergedRef} style={{ height: 0, flex: 1 }}>
        {subtitleMode === 'list' ? (
          <VirtualList
            style={{ width: '100%', height: '100%', paddingRight: 10 }}
            estimateSize={30}
            items={currentSubtitles}
            overscan={30}
            ref={virtualizerRef}
            renderItem={(s, idx) => (
              <SubtitleItem currentTime={currentTime} index={idx} subtitle={s} key={s.id} selected={idx === currentSelectedIndex} />
            )}
          />
        ) : (
          <Content style={{ height: '100%', overflowY: 'auto', paddingRight: 10 }}>
            {currentSubtitles?.map((i, idx) => (
              <ArticleSubtitleItem index={idx} scrollable={subtitleFollow && !isIn} subtitle={i} selected={idx === currentSelectedIndex} />
            ))}
          </Content>
        )}
      </Content>
    </Content>
  )
})

const ArticleSubtitleItem = memo(
  ({
    subtitle,
    selected,
    scrollable,
    index
  }: {
    subtitle: Required<IMediaState>['subtitles'][0]
    selected: boolean
    scrollable: boolean
    index: number
  }) => {
    const ref = useRef<HTMLSpanElement>(null)
    const instance = useMediaInstance()

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
            instance.actionOps?.jumpTo(subtitle.startTime)
          }
        }}
      >
        {subtitle.text}
      </span>
    )
  }
)

const SubtitleItem = memo(
  ({ subtitle, selected, index }: { subtitle: Required<IMediaState>['subtitles'][0]; selected: boolean; index: number }) => {
    const instance = useMediaInstance()
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
            instance.actionOps?.jumpTo(subtitle.startTime)
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
          <div style={{ userSelect: 'text', fontSize: FontSize['13px'], whiteSpace: 'pre-wrap' }}>{subtitle.text}</div>
        </Content>
        <Tooltip content={'Add as label'}>
          <Icon
            name="park-plus"
            containerStyle={{ flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
            className={ClassName.circleButton()}
            onClick={e => {
              e.stopPropagation()
              instance.insertLabel?.(
                {
                  time: subtitle.startTime,
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

export default MediaSubtitleSidebar
