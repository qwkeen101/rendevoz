import { useIsIn, useMergedRef } from '@/hooks'
import useMediaState, { IMediaState } from '@/core/components/media/hooks/useMediaState'
import { Button, Content, Icon, IconWithPopover, Tooltip, VirtualList, WithBorder } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { ClassName } from 'rendevoz'
import { memo, useEffect, useRef, useState } from 'react'
import FontSize from '@/consts/font'
import Colors from '../../../../../consts/colors'
import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'
import { VideoSidebarStateAtom } from '@/core/components/media/hooks/useMediaSidebarState'
import { WebVTTParser } from 'webvtt-parser'
import { Virtualizer } from '@tanstack/react-virtual'
import useSubtitleSelectAsLabel from '@/core/components/media/hooks/useSubtitleSelectAsLabel'
import translateSubtitle from '@/core/components/media/components/sidebar/translateSubtitle'
import produce from 'immer'
import { IMediaSubtitle } from '~/typings'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import scrollIntoView from 'scroll-into-view-if-needed'
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
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(0)
  const { ref, isIn } = useIsIn()
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  useEffect(() => {
    if (currentTime && currentSubtitles) {
      const index = currentSubtitles.findLastIndex(i => i.startTime <= currentTime && i.endTime >= currentTime)
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
        if (targetFile.value) {
          setMediaState(s => ({
            ...s,
            subtitleLang: targetFile.lang,
            subtitles: targetFile.value.map(i => ({ startTime: i.start, endTime: i.end, text: i.text }))
          }))
          return
        }
        if (targetFile.url) {
          fetch(targetFile.url).then(async file => {
            const text = await file.text()
            try {
              const json = JSON.parse(text)
              setMediaState(s => ({
                ...s,
                subtitles: json,
                subtitleLang: subtitleLang || subtitles[0].lang,
                subtitleUrl: targetFile.url
              }))
            } catch (e) {
              const parser = new WebVTTParser()
              const tree = parser.parse(text, 'metadata')
              console.log(tree)
              setMediaState(s => ({
                ...s,
                subtitles: tree.cues,
                subtitleLang: subtitleLang || subtitles[0].lang,
                subtitleUrl: targetFile.url
              }))
            }
          })
        }
      }
    }
  }, [subtitleLang])
  useEffect(() => {
    if (isIn || !subtitleFollow) return
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
    if (subtitleMode === 'article') {
      const el = containerRef.current?.querySelector(`[data-subtitle-index="${currentSelectedIndex}"]`) as HTMLElement | undefined
      if (el) {
        el.parentElement.scrollTop = el.offsetTop - el.parentElement.clientHeight / 2 + el.offsetHeight / 2
      }
    }
  }, [currentSelectedIndex, subtitleMode])
  const instance = useMediaInstance()
  const { renderPopover, containerRef, rangeExtractor } = useSubtitleSelectAsLabel(currentSubtitles)
  const mergedRef = useMergedRef(containerRef, ref)
  const { t } = useTranslation()
  const [showTranslation, setShowTranslation] = useState(true)
  if (!currentSubtitles.length && !subtitles.length)
    return (
      <Content flex centered fullWidth fullHeight style={{ minHeight: 240 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>No subtitle imported</div>
      </Content>
    )
  return (
    <Content fullWidth fullHeight style={{ minHeight: 240, padding: '0px 12px 12px' }} flex column>
      {renderPopover()}
      <Content flex gap={12} style={{ margin: '6px 0px', paddingLeft: 8 }}>
        <div style={{ fontWeight: 600 }} className={'ellipsis-font-1'}>
          {subtitleLang || 'Unselected subtitle'}
        </div>
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
                onClick={() => {
                  setMediaState(s => ({ ...s, subtitleMode: 'list' }))
                  instance.on?.({ type: 'subtitleUpdated', subtitleMode: 'list' })
                }}
              />
              <SelectButton
                icon={'park-align-text-middle-one'}
                text={'文章模式'}
                onClick={() => {
                  setMediaState(s => ({ ...s, subtitleMode: 'article' }))
                  instance.on?.({ type: 'subtitleUpdated', subtitleMode: 'article' })
                }}
              />
              <div className={ClassName.description(FontSize['12px'])}>字幕语言</div>
              {subtitles.map((i, index) => (
                <SelectButton
                  onClick={() => {
                    setMediaState(s => ({ ...s, subtitleLang: i.lang }))
                    instance.on?.({ type: 'subtitleUpdated', subtitleLang: i.lang })
                  }}
                  text={i.lang}
                  key={index}
                  onSuffixIconClick={e => {
                    e.stopPropagation()
                    const copyed = subtitles.slice(0)
                    copyed.splice(index, 1)
                    setMediaState(s => ({ ...s, subtitleList: [...copyed] }))
                    instance.on?.({ type: 'subtitleUpdated', subtitleList: [...copyed] })
                  }}
                  suffixIcon={'park-delete'}
                />
              ))}
              <div style={{ width: '100%', height: 1, background: Colors.Background.Border }}></div>
              <SelectButton
                text={'字幕跟随'}
                enabled={subtitleFollow}
                onClick={() => {
                  setMediaState(s => ({ ...s, subtitleFollow: !mediaState.subtitleFollow }))
                  instance.on?.({ type: 'subtitleUpdated', subtitleFollow: !mediaState.subtitleFollow })
                }}
              />
            </WithBorder>
          }
          placement={['bottom']}
        />
        {currentSubtitles.some(i => i.translation) ? (
          <ButtonSwitch
            style={{
              gap: 6,
              marginLeft: 'auto',
              flexShrink: 0
            }}
            className={'font-size-13 transparent-font'}
            name={'Show translation'}
            value={showTranslation}
            onChange={v => setShowTranslation(v)}
          ></ButtonSwitch>
        ) : (
          <Button.IconButton
            text={t('general.translate')}
            icon={'park-translate'}
            className={'font-size-13'}
            style={{
              marginLeft: 'auto',
              flexShrink: 0
            }}
            onClick={() => {
              translateSubtitle(currentSubtitles).then(texts => {
                setMediaState(s =>
                  produce(s, draft => {
                    draft.subtitles?.forEach((s, idx) => {
                      s.translation = texts[idx]
                    })
                  })
                )
              })
            }}
          ></Button.IconButton>
        )}
        {/*<div*/}
        {/*  onClick={() => {*/}
        {/* Summarize the subtitles with an overview and summarization with timestamp, return in json format: {overview: string, summarizations: [{startTime: number, endTime: number, summarization: string }]}, time should be represented in seconds.*/}
        {/*    const tracked = currentSubtitles.map(i => `${normalizeSecondsToTime(i.startTime)} ${i.text}`).join('\n')*/}
        {/*    console.log(tracked)*/}
        {/*  }}*/}
        {/*>*/}
        {/*  summarize*/}
        {/*</div>*/}
      </Content>
      <Content fullHeight fullWidth ref={mergedRef} style={{ height: 0, flex: 1 }} role={'subtitle-container'}>
        {subtitleMode === 'list' ? (
          <VirtualList
            rangeExtractor={r => rangeExtractor(r)}
            paddingEnd={200}
            style={{ width: '100%', height: '100%' }}
            estimateSize={30}
            items={currentSubtitles}
            ref={virtualizerRef}
            renderItem={(s, idx) => (
              <SubtitleItem
                showTrans={showTranslation}
                currentTime={currentTime}
                index={idx}
                subtitle={s}
                key={s.id}
                selected={idx === currentSelectedIndex}
              />
            )}
          />
        ) : (
          <Content style={{ height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
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
  ({ subtitle, selected, index, showTrans }: { subtitle: IMediaSubtitle; selected: boolean; index: number; showTrans?: boolean }) => {
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
        <Content flex gap={10} alignItems={'start'}>
          <div className={ClassName.description(FontSize['11px'])} style={{ lineHeight: '22px', userSelect: 'none' }}>
            {normalizeSecondsToTime(subtitle.startTime)}
          </div>
          <div style={{ userSelect: 'text', fontSize: FontSize['13px'], whiteSpace: 'pre-wrap' }}>
            {subtitle.text}
            {subtitle.translation && showTrans && <div style={{ userSelect: 'none' }}>{subtitle.translation}</div>}
          </div>
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
