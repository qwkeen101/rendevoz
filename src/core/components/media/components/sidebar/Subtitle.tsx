import { useDebounceEffect, useIsIn, useMergedRef } from '@/hooks'
import useMediaState, { IMediaState } from '@/core/components/media/hooks/useMediaState'
import { Button, Icon, IconWithPopover, VirtualList, WithBorder, Virtualizer, Switch } from '@/components'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Colors from '@/consts/colors'
import { useTranslation } from 'react-i18next'
import { WebVTTParser } from 'webvtt-parser'
import useSubtitleSelectAsLabel from '@/core/components/media/hooks/useSubtitleSelectAsLabel'
import translateSubtitle from '@/core/components/media/components/sidebar/translateSubtitle'
import produce from 'immer'
import { IMediaSubtitle } from '~/typings'
import fuzzysort from 'fuzzysort'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import classnames from 'classnames'
import FileSystem from '@/api/fileSystem'
import EmptyList from '@/core/components/common/EmptyList'

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
  useLayoutEffect(() => {
    if (searchState.visible) return
    if (currentTime && currentSubtitles) {
      const index = currentSubtitles.findLastIndex(i => i.startTime <= currentTime && i.endTime >= currentTime)
      if (index >= 0) {
        setCurrentSelectedIndex(index)
      }
    } else {
      setCurrentSelectedIndex(0)
    }
  }, [currentTime, currentSubtitles.length, searchState.visible])
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
            subtitles: targetFile.value.map(i => ({ start: i.start, end: i.end, text: i.text }))
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
    } else {
      setMediaState(s => ({ ...s, subtitles: undefined }))
    }
  }, [subtitleLang, subtitles.length])
  useLayoutEffect(() => {
    if (visible || isSelecting) return
    if (!searchState.visible) {
      if (isIn || !subtitleFollow) return
    }
    if (!currentSubtitles?.length) return
    if (subtitleMode === 'list') {
      const virtualizer = virtualizerRef.current
      if (virtualizer && !isIn && subtitleFollow) {
        virtualizer.scrollToIndex(currentSelectedIndex, {
          align: 'center'
        })
      }
    }
    if (subtitleMode === 'article') {
      const el = containerRef.current?.querySelector(`[data-subtitle-index="${currentSelectedIndex}"]`) as HTMLElement | undefined
      if (el && el.parentElement) {
        el.parentElement.scrollTop = el.offsetTop - el.parentElement.clientHeight / 2 + el.offsetHeight / 2
      }
    }
  }, [currentSelectedIndex, subtitleMode])
  const [showTranslation, setShowTranslation] = useState(true)
  const instance = useMediaInstance()
  const { renderPopover, containerRef, rangeExtractor, visible, isSelecting } = useSubtitleSelectAsLabel(currentSubtitles, showTranslation)
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
  useEffect(() => {
    if (searchState.currIdx !== undefined && searchState.currIdx >= 0) {
      setCurrentSelectedIndex(searchState.currIdx)
    }
  }, [searchState.currIdx])
  const { t } = useTranslation()

  if (!currentSubtitles.length && !subtitles.length) {
    return <EmptyList className={'h-full'} />
  }
  return (
    <div className={'w-full h-full flex flex-col'}>
      {renderPopover()}
      <div className={'p-2 w-full gap-6 flex justify-between items-center transparent-font'}>
        <div className={'line-clamp-1 pl-1 max-w-[60%] break-all font-size-13'}>{subtitleLang || 'Unselected subtitle'}</div>
        <div className={'flex gap-1.5 items-center shrink-0'}>
          {currentSubtitles.some(i => i.translation) ? (
            <div className={'flex items-center gap-2.5 mr-1.5'}>
              <Icon name={'park-translate'} />
              <Switch small value={showTranslation} onChange={v => setShowTranslation(v)}></Switch>
            </div>
          ) : (
            <Icon
              spin={mediaState.isTranslating === subtitleLang}
              name={mediaState.isTranslating === subtitleLang ? Icons.Loading : 'park-translate'}
              className={'square-button'}
              onClick={() => {
                if (mediaState.isTranslating === subtitleLang) return
                setMediaState(s => ({ ...s, isTranslating: subtitleLang }))
                const currentLang = subtitleLang
                translateSubtitle(currentSubtitles, res => {
                  setMediaState(s =>
                    produce(s, draft => {
                      if (draft.subtitleLang === currentLang) {
                        draft.subtitles?.forEach((s, idx) => {
                          const idxToText = new Map(res.map(i => [i.id, i.text]))
                          if (idxToText.has(idx)) {
                            s.translation = idxToText.get(idx)
                          }
                        })
                      }
                    })
                  )
                }).finally(() => {
                  setMediaState(s => ({ ...s, isTranslating: undefined }))
                })
              }}
            ></Icon>
          )}
          {currentSubtitles.length ? (
            <Icon
              name={Icons.Search}
              className={classnames('square-button', searchState.visible && 'active-button')}
              onClick={() => {
                setSearchState(s => ({ ...s, visible: !s.visible }))
              }}
            />
          ) : null}
          <IconWithPopover
            className={'square-button'}
            name={Icons.More}
            padding={6}
            size={14}
            renderOnParent={false}
            content={setV => (
              <WithBorder className={'flex flex-col min-w-56 max-w-80 max-h-96 overflow-y-auto p-1 font-size-13'}>
                <div className={'menu-sub-title em:mt-1 em:pl-2'}>字幕样式</div>
                <Button.IconButton
                  enabled={subtitleMode === 'list'}
                  className={'button'}
                  text={'列表模式'}
                  onClick={() => {
                    setV(false)
                    setMediaState(s => ({ ...s, subtitleMode: 'list' }))
                    instance.on?.({ type: 'subtitleUpdated', subtitleMode: 'list' })
                  }}
                ></Button.IconButton>
                <Button.IconButton
                  text={'文章模式'}
                  className={'button'}
                  enabled={subtitleMode === 'article'}
                  onClick={() => {
                    setV(false)
                    setMediaState(s => ({ ...s, subtitleMode: 'article' }))
                    instance.on?.({ type: 'subtitleUpdated', subtitleMode: 'article' })
                  }}
                ></Button.IconButton>
                <div className={'menu-sub-title em:pl-2 mt-2'}>字幕语言</div>
                {subtitles.map((i, index) => (
                  <Button.IconButton
                    onClick={() => {
                      setV(false)
                      setMediaState(s => ({ ...s, subtitleLang: i.lang }))
                      instance.on?.({ type: 'subtitleUpdated', subtitleLang: i.lang })
                    }}
                    text={i.lang}
                    key={index}
                    suffixIconClassName={'hover-active-button icon-14'}
                    onSuffixIconClick={e => {
                      e.stopPropagation()
                      const copyed = subtitles.slice(0)
                      const deleted = copyed.splice(index, 1)
                      if (deleted.length) {
                        const first = deleted[0]
                        if (first.url) {
                          FileSystem.fs.deleteFile(first.url)
                        }
                      }
                      setMediaState(s => {
                        const next = {
                          ...s,
                          subtitleList: [...copyed],
                          subtitleLang: i.lang === s.subtitleLang ? undefined : s.subtitleLang
                        }
                        instance.on?.({
                          type: 'subtitleUpdated',
                          subtitleList: next.subtitleList,
                          subtitleLang: next.subtitleLang
                        })
                        return next
                      })
                    }}
                    suffixIcon={'park-delete-one'}
                  />
                ))}
              </WithBorder>
            )}
            placement={['bottom', 'top']}
          />
        </div>
      </div>
      {searchState.visible && (
        <div className={'flex items-center transparent-font font-size-13 px-3 py-2 border-top mb-2 border-bottom'}>
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
            defaultValue={searchState.q}
            onChange={e => {
              setSearchState(s => ({ ...s, q: e.target.value }))
            }}
            autoFocus
            className={'rounded-md flex-1'}
          />
          {(searchState.results?.length ?? 0) > 1 ? (
            <div className={'items-center gap-2 flex ml-3.5'}>
              <div className={'font-size-12 mr-1'}>
                {searchState.results?.indexOf(searchState.currIdx) + 1} / {searchState.results?.length}
              </div>
              <Icon size={14} name={'park-up'} className={'square-button-small'} onClick={() => handleNavigateSearch('up')} />
              <Icon size={14} name={'park-down'} className={'square-button-small'} onClick={() => handleNavigateSearch('down')} />
            </div>
          ) : null}
        </div>
      )}
      <div ref={mergedRef} role={'subtitle-container'} className={'flex-1 w-full overflow-hidden'}>
        {subtitleMode === 'list' ? (
          currentSubtitles?.length ? (
            <VirtualList
              rangeExtractor={r => rangeExtractor(r)}
              paddingEnd={100}
              className={'w-full h-full px-2'}
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
          <div className={'overflow-y-auto h-full px-4 pb-20'}>
            {currentSubtitles?.map((i, idx) => (
              <ArticleSubtitleItem showTrans={showTranslation} index={idx} subtitle={i} selected={idx === currentSelectedIndex} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

const ArticleSubtitleItem = memo(
  ({
    subtitle,
    selected,
    index,
    showTrans
  }: {
    subtitle: Required<IMediaState>['subtitles'][0]
    selected: boolean
    index: number
    showTrans: boolean
  }) => {
    const ref = useRef<HTMLSpanElement>(null)
    const instance = useMediaInstance()

    return (
      <span
        data-subtitle-index={index}
        className={classnames('button !select-text !p-0 ml-1', selected && 'active-button')}
        ref={ref}
        onClick={() => {
          if (window.getSelection()?.isCollapsed) {
            instance.actionOps?.jumpTo(subtitle.start)
          }
        }}
      >
        {subtitle.translation && showTrans ? subtitle.translation : subtitle.text}
      </span>
    )
  }
)

const SubtitleItem = memo(
  ({ subtitle, selected, index, showTrans }: { subtitle: IMediaSubtitle; selected: boolean; index: number; showTrans?: boolean }) => {
    const instance = useMediaInstance()
    return (
      <div
        data-subtitle-index={index}
        className={'button !select-auto flex justify-between items-center'}
        onClick={e => {
          setTimeout(() => {
            if (window.getSelection()?.isCollapsed) {
              instance.actionOps?.jumpTo(subtitle.start)
            }
          })
        }}
        style={{
          background: selected ? Colors.Common.SelectColorTransparent : undefined
        }}
      >
        <div className={'flex items-center gap-3'}>
          <div className={'transparent-font pointer-events-none font-mono text-xs select-none'}>
            {normalizeSecondsToTime(subtitle.start)}
          </div>
          <div className={'select-text whitespace-pre-wrap'}>
            {subtitle.translation && showTrans ? subtitle.translation : subtitle.text}
          </div>
        </div>
      </div>
    )
  }
)

export default MediaSubtitle
