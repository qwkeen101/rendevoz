import { useDebounceEffect, useIsIn, useMergedRef } from '@/hooks'
import useMediaState, { IMediaState } from '@/core/components/media/hooks/useMediaState'
import { Button, Content, Icon, IconWithPopover, Tooltip, VirtualList, WithBorder, Virtualizer } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { ClassName } from 'rendevoz'
import { memo, useEffect, useRef, useState } from 'react'
import Colors from '@/consts/colors'
import { useTranslation } from 'react-i18next'
import { WebVTTParser } from 'webvtt-parser'
import useSubtitleSelectAsLabel from '@/core/components/media/hooks/useSubtitleSelectAsLabel'
import translateSubtitle from '@/core/components/media/components/sidebar/translateSubtitle'
import produce from 'immer'
import { IMediaSubtitle } from '~/typings'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import fuzzysort from 'fuzzysort'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import classnames from 'classnames'
const SelectButton: typeof Button.IconButton = props => {
  return <Button.IconButton {...props} style={{ padding: '3px 6px', lineHeight: 1.4, fontSize: 14 }} />
}
const MediaSubtitle = memo(() => {
  const [mediaState, setMediaState] = useMediaState()
  const [searchState, setSearchState] = useState<{
    visible: boolean
    q?: string
    results?: number[]
    currIdx?: number
  }>({ visible: false })
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
    if (searchState.visible) return
    if (currentTime && currentSubtitles) {
      const index = currentSubtitles.findLastIndex(i => i.startTime <= currentTime && i.endTime >= currentTime)
      if (index >= 0) {
        setCurrentSelectedIndex(index)
      }
    } else {
      setCurrentSelectedIndex(0)
    }
  }, [currentTime, currentSubtitles, searchState.visible])
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
  }, [subtitleLang, subtitles.length])
  useEffect(() => {
    if (visible) return
    if (!searchState.visible) {
      if (isIn || !subtitleFollow) return
    }
    if (!currentSubtitles?.length) return
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
      if (el && el.parentElement) {
        el.parentElement.scrollTop = el.offsetTop - el.parentElement.clientHeight / 2 + el.offsetHeight / 2
      }
    }
  }, [currentSelectedIndex, subtitleMode])
  const instance = useMediaInstance()
  const { renderPopover, containerRef, rangeExtractor, visible } = useSubtitleSelectAsLabel(currentSubtitles)
  const mergedRef = useMergedRef(containerRef, ref)
  const searchSubtitle = (q: string) => {
    const results = Array.from(
      fuzzysort
        .go(
          q,
          currentSubtitles.map((i, idx) => ({ ...i, idx })),
          {
            key: 'text',
            threshold: -1000
          }
        )
        .values()
    )
    results.sort((b, a) => b.obj.idx - a.obj.idx)
    setSearchState(s => ({ ...s, results: results.map(i => i.obj.idx), currIdx: results[0]?.obj.idx ?? 0 }))
  }
  const handleNavigateSearch = (direction: 'up' | 'down') => {
    const results = searchState.results
    if (!results) return
    let next = searchState.currIdx !== undefined ? results.indexOf(searchState.currIdx) : 0
    if (direction === 'up') {
      next = next - 1 < 0 ? results.length - 1 : next - 1
    } else {
      next = next + 1 >= results.length ? 0 : next + 1
    }
    console.log(results[next], next, searchState.currIdx, results)
    setSearchState(s => ({ ...s, currIdx: results[next] }))
  }
  useDebounceEffect(
    () => {
      if (searchState.q) {
        searchSubtitle(searchState.q)
      } else {
        setSearchState(s => ({ ...s, results: [], currIdx: undefined }))
      }
    },
    [searchState.q],
    { wait: 200 }
  )
  const [showTranslation, setShowTranslation] = useState(true)
  useEffect(() => {
    if (searchState.currIdx !== undefined && searchState.currIdx >= 0) {
      setCurrentSelectedIndex(searchState.currIdx)
    }
  }, [searchState.currIdx])
  const { t } = useTranslation()
  if (!currentSubtitles.length && !subtitles.length)
    return (
      <Content flex centered fullWidth fullHeight style={{ minHeight: 240 }}>
        <div className={'bold-font transparent-font'}>No subtitle</div>
      </Content>
    )
  return (
    <Content fullWidth style={{ height: 0, flex: 1 }} flex column>
      {renderPopover()}
      <Content flex gap={8} fullWidth style={{ padding: '6px 10px 6px 14px' }} className={'font-size-14'} alignItems={'center'}>
        <div style={{ fontWeight: 500 }} className={'ellipsis-font-1'}>
          {subtitleLang || 'Unselected subtitle'}
        </div>
        <IconWithPopover
          className={ClassName.flatButton(4, '2px')}
          name={'park-more'}
          containerStyle={{
            marginRight: 'auto'
          }}
          size={18}
          renderOnParent={false}
          content={setV => (
            <WithBorder width={200} padding={6} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ paddingLeft: 4 }} className={'font-size-12 transparent-font'}>
                字幕样式
              </div>
              <SelectButton
                text={'列表模式'}
                onClick={() => {
                  setV(false)
                  setMediaState(s => ({ ...s, subtitleMode: 'list' }))
                  instance.on?.({ type: 'subtitleUpdated', subtitleMode: 'list' })
                }}
              />
              <SelectButton
                text={'文章模式'}
                onClick={() => {
                  setV(false)
                  setMediaState(s => ({ ...s, subtitleMode: 'article' }))
                  instance.on?.({ type: 'subtitleUpdated', subtitleMode: 'article' })
                }}
              />
              <div style={{ paddingLeft: 4 }} className={'font-size-12 transparent-font'}>
                字幕语言
              </div>
              {subtitles.map((i, index) => (
                <SelectButton
                  onClick={() => {
                    setV(false)
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
              <div style={{ width: '100%', height: 1, margin: '2px 0px', background: Colors.Background.Border }}></div>
              <SelectButton
                text={'字幕跟随'}
                enabled={subtitleFollow}
                onClick={() => {
                  setMediaState(s => ({ ...s, subtitleFollow: !mediaState.subtitleFollow }))
                  instance.on?.({ type: 'subtitleUpdated', subtitleFollow: !mediaState.subtitleFollow })
                }}
              />
            </WithBorder>
          )}
          placement={['bottom']}
        />
        <Content flex gap={4} alignItems={'center'} style={{ flexShrink: 0 }}>
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
            <Icon
              name={'park-translate'}
              className={ClassName.flatButton(4, '4px')}
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
            ></Icon>
          )}
          {currentSubtitles.length ? (
            <Icon
              name={'park-search'}
              className={classnames(ClassName.flatButton(4, '4px'), searchState.visible && 'active-button')}
              onClick={() => {
                setSearchState(s => ({ ...s, visible: !s.visible }))
              }}
            />
          ) : null}
        </Content>
      </Content>
      {searchState.visible && (
        <Content
          className={'font-size-14'}
          flex
          alignItems={'center'}
          style={{
            margin: '0px 10px 8px'
          }}
        >
          <input
            placeholder={t('general.Type to search')}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                e.preventDefault()
                handleNavigateSearch('down')
              }
              if (isHotkey(KEY.Escape, e)) {
                setSearchState(s => ({ ...s, visible: false }))
              }
            }}
            onChange={e => {
              setSearchState(s => ({ ...s, q: e.target.value }))
            }}
            className={'focus-input border-box-shadow'}
            style={{ borderRadius: 4, flex: 1, padding: '4px 8px' }}
          />
          {(searchState.results?.length ?? 0) > 1 ? (
            <Content
              flex
              gap={4}
              alignItems={'center'}
              style={{
                marginLeft: 8
              }}
            >
              <div
                className={'font-size-12 transparent-font'}
                style={{
                  marginRight: 12
                }}
              >
                {searchState.results?.indexOf(searchState.currIdx) + 1} / {searchState.results?.length}
              </div>
              <Icon name={'park-up'} className={ClassName.flatButton(4, '4px')} onClick={() => handleNavigateSearch('up')} />
              <Icon name={'park-down'} className={ClassName.flatButton(4, '4px')} onClick={() => handleNavigateSearch('down')} />
            </Content>
          ) : null}
        </Content>
      )}
      <Content
        flex
        column
        fullWidth
        ref={mergedRef}
        style={{ height: 0, flex: 1, minHeight: 120 }}
        role={'subtitle-container'}
        className={'border-top'}
      >
        {subtitleMode === 'list' ? (
          currentSubtitles?.length ? (
            <VirtualList
              rangeExtractor={r => rangeExtractor(r)}
              paddingEnd={100}
              style={{ width: '100%', height: '0', flex: 1, padding: '6px' }}
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
          ) : null
        ) : (
          <Content style={{ height: 0, flex: 1, overflowY: 'auto', padding: '10px 12px 100px' }} className={'font-size-14'}>
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
        className={classnames(ClassName.flatButton(4, '0px'), selected && 'active-button')}
        style={{
          paddingLeft: 6,
          borderRadius: 4,
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
        onClick={e => {
          setTimeout(() => {
            if (window.getSelection()?.isCollapsed) {
              instance.actionOps?.jumpTo(subtitle.startTime)
            }
          })
        }}
        style={{
          background: selected ? Colors.Common.SelectColorTransparent : undefined
        }}
        alignItems="center"
      >
        <Content flex gap={10} alignItems={'start'}>
          <div className={'transparent-font font-size-12'} style={{ lineHeight: '22px', userSelect: 'none' }}>
            {normalizeSecondsToTime(subtitle.startTime)}
          </div>
          <div className={'font-size-14'} style={{ userSelect: 'text', whiteSpace: 'pre-wrap' }}>
            {subtitle.text}
            {subtitle.translation && showTrans && <div style={{ userSelect: 'none' }}>{subtitle.translation}</div>}
          </div>
        </Content>
        <Icon
          name="park-high-light"
          containerStyle={{ flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.16s ease' }}
          className={ClassName.flatButton(4, '4px')}
          onClick={e => {
            e.stopPropagation()
            const parentBounding = e.currentTarget.parentElement!.getBoundingClientRect()
            instance.insertLabel?.(
              {
                time: subtitle.startTime,
                name: subtitle.text
              },
              {
                shouldJumpBack: false,
                popoverPosition: {
                  x: parentBounding.left + parentBounding.width / 2,
                  y: parentBounding.bottom
                }
              }
            )
          }}
        />
      </Content>
    )
  }
)

export default MediaSubtitle
