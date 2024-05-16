import { atom, useAtom } from 'jotai/index'
import { ILabel, ILabelContainerProps, IMediaLabel, IPdfLabel } from '~/typings'
import { ReactElement, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Virtualizer } from '@tanstack/react-virtual'
import { useDebounceEffect, useDebounceFn, useUpdateEffect } from '@/hooks'
import fuzzysort from 'fuzzysort'
import { MetaStore, ObjectStore } from '@/api/stores'
import { IconWithPopover, Menu, VirtualList, WithBorder } from '@/components'
import ClassName from '@/styles/classNames'
import { Path } from 'slate'

const LabelSearchAtom = atom<{
  searchInput?: string
  results?: ILabel[]
}>({})

const SortToTranslation: Record<Required<ILabelContainerProps>['labelSortMode'], string> = {
  'created at': 'general.Created at',
  'updated at': 'general.Updated at',
  'page reverse': 'general.Page number in reverse',
  page: 'general.Page number',
  'playback time': 'general.Playback time',
  'playback time in reverse': 'general.Playback time in reverse',
  'article order': 'general.Article order',
  'article order in reverse': 'general.Article order in reverse'
}

export default <T extends ILabel>(
  type: string,
  labelIds?: number[],
  opts?: {
    availableSorts?: Required<ILabelContainerProps>['labelSortMode'][]
    defaultSortMode?: ILabelContainerProps['labelSortMode']
    defaultPriority?: ILabelContainerProps['labelPriority']
    defaultScrollOffset?: number
    getPathFromLabel?: (label: T) => Path | undefined
    onOffsetChange?: (offset: number) => void
    onPriorityChange?: (p: ILabelContainerProps['labelPriority']) => void
    onSortModeChange?: (sortMode: ILabelContainerProps['labelSortMode']) => void
  }
) => {
  const [sortedLabels, setSortedLabels] = useState<T[]>()
  const [sortMode, setSortMode] = useState<ILabelContainerProps['labelSortMode']>(opts?.defaultSortMode ?? 'created at')
  const [priority, setPriority] = useState<ILabelContainerProps['labelPriority']>(opts?.defaultPriority ?? 'none')
  const [labelSearch, setLabelSearch] = useAtom(LabelSearchAtom)
  const [currentHighlight, setCurrentHighlight] = useState<number>()
  const { t } = useTranslation()
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>()
  const scrolled = useRef(false)
  const debounceChangeOffset = useDebounceFn(
    (o: number) => {
      opts?.onOffsetChange?.(o)
    },
    { wait: 200 }
  )
  useEffect(() => {
    if (labelIds?.length !== undefined) {
      const action = async () => {
        const labels = (
          labelSearch.results?.length
            ? labelSearch.results
            : (await Promise.all(labelIds?.map(i => ObjectStore(type).getOneById(i)) || [])).filter(i => i)
        ) as T[]
        if (!labelSearch.results?.length) {
          if (sortMode === 'playback time in reverse') {
            ;(labels as IMediaLabel[]).sort((b, a) => (a.time ?? 0) - (b.time ?? 0))
          }
          if (sortMode === 'playback time') {
            ;(labels as IMediaLabel[]).sort((b, a) => (b.time ?? 0) - (a.time ?? 0))
          }
          if (sortMode === 'article order in reverse' || sortMode === 'article order') {
            const getOrder = opts?.getPathFromLabel
            if (getOrder) {
              if (sortMode === 'article order') {
                labels.sort((a, b) => {
                  const bPath = getOrder(b)
                  const aPath = getOrder(a)
                  if (!aPath || !bPath) return 0
                  return Path.equals(bPath, aPath) ? 0 : Path.isBefore(bPath, aPath) ? 1 : -1
                })
              }
              if (sortMode === 'article order in reverse') {
                labels.sort((b, a) => {
                  const bPath = getOrder(b)
                  const aPath = getOrder(a)
                  if (!aPath || !bPath) return 0
                  return Path.equals(bPath, aPath) ? 0 : Path.isBefore(bPath, aPath) ? 1 : -1
                })
              }
            }
          }
          if (sortMode === 'page' || sortMode === 'page reverse') {
            ;(labels as IPdfLabel[]).sort((b, a) => {
              const bP = b.page
              const aP = a.page
              if (bP !== aP) {
                return sortMode === 'page' ? bP - aP : aP - bP
              } else {
                let bT = 0,
                  aT = 0
                if ('rect' in b) {
                  bT = b.rect.top
                }
                if ('rects' in b && b.rects) {
                  bT = b.rects[0].percentageTop
                }
                if ('rect' in a) {
                  aT = a.rect.top
                }
                if ('rects' in a && a.rects) {
                  aT = a.rects[0].percentageTop
                }
                if (aT && bT) {
                  return bT - aT
                }
                return 0
              }
            })
          } else if (sortMode === 'created at') {
            labels.sort((b, a) => a.createdAt - b.createdAt)
          } else if (sortMode === 'updated at') {
            labels.sort((b, a) => a.updatedAt - b.updatedAt)
          }
        }

        if (priority !== 'none') {
          if (priority === 'note') {
            labels.sort((b, a) => {
              const aNote = a.name
              const bNote = b.name
              if (aNote && !bNote) {
                return 1
              }
              if (aNote && bNote) {
                return 0
              }
              if (!aNote && bNote) {
                return -1
              }
              return 0
            })
          }
          if (priority === 'tag') {
            labels.sort((b, a) => {
              const aTag = MetaStore.getMetaObjectByObjectId(a.id, false)?.tags
              const bTag = MetaStore.getMetaObjectByObjectId(b.id, false)?.tags
              if (aTag?.length && !bTag?.length) {
                return 1
              }
              if (aTag?.length && bTag?.length) {
                return 0
              }
              if (!aTag?.length && bTag?.length) {
                return -1
              }
              return 0
            })
          }
        }
        setSortedLabels(labels)
      }
      action()
    } else {
      setSortedLabels([])
    }
  }, [labelIds, sortMode, labelSearch.results, priority])
  useUpdateEffect(() => {
    opts?.onPriorityChange?.(priority)
    virtualizerRef.current?.scrollToIndex(0, { align: 'start' })
  }, [priority])
  useUpdateEffect(() => {
    opts?.onSortModeChange?.(sortMode)
    virtualizerRef.current?.scrollToIndex(0, { align: 'start' })
  }, [sortMode])
  useEffect(() => {
    const offset = opts?.defaultScrollOffset
    if (sortedLabels?.length && offset !== undefined && !scrolled.current) {
      setTimeout(() => {
        virtualizerRef.current?.scrollToOffset(offset, { align: 'start' })
      })
      scrolled.current = true
    }
  }, [sortedLabels])
  useDebounceEffect(
    () => {
      if (labelSearch.searchInput && sortedLabels?.length) {
        const result = fuzzysort.go(
          labelSearch.searchInput,
          sortedLabels.filter(i => i),
          {
            keys: ['selectedText', 'name', 'description'],
            threshold: -1000000
          }
        )
        setLabelSearch(s => ({ ...s, results: result.map(i => i.obj) }))
      } else {
        setLabelSearch(s => ({ ...s, results: undefined }))
      }
    },
    [labelSearch.searchInput],
    { wait: 500 }
  )
  // @ts-ignore
  const renderSort = () => (
    <IconWithPopover
      size={16}
      name={'park-sort-two'}
      placement={['bottom']}
      boundaryInset={10}
      content={setV => (
        <WithBorder padding={'0.2rem 0 0.4rem'}>
          <Menu.NavigationMenu
            keyboardNavigation={false}
            onSelect={v => {
              setV(false)
              if (v && v.type === 'item') {
                setSortMode(v.key)
              }
            }}
            defaultSelected={sortMode ? [sortMode] : undefined}
            layout={[
              {
                type: 'title',
                name: t('general.Sort by')
              },
              // @ts-ignore
              ...(opts?.availableSorts?.map(i => ({
                type: 'item',
                key: i,
                text: t(SortToTranslation[i])
              })) || [])
            ]}
          />
          <Menu.NavigationMenu
            keyboardNavigation={false}
            defaultSelected={priority ? [priority] : undefined}
            layout={[
              {
                type: 'title',
                name: t('general.Priority')
              },
              {
                type: 'item',
                text: t('general.Note priority'),
                key: 'note',
                onSelect: () => {
                  setPriority('note')
                  setV(false)
                }
              },
              {
                type: 'item',
                text: t('general.Tag priority'),
                key: 'tag',
                onSelect: () => {
                  setPriority('tag')
                  setV(false)
                }
              },
              {
                type: 'item',
                text: t('general.No priority'),
                key: 'none',
                onSelect: () => {
                  setPriority('none')
                  setV(false)
                }
              }
            ]}
          />
        </WithBorder>
      )}
      className={ClassName.flatButton(4, '4px')}
    />
  )
  const renderContainer = (renderItem: (label: T, highlighted?: boolean) => ReactElement) => {
    if (!sortedLabels?.length) return null
    return (
      <VirtualList
        paddingEnd={100}
        overscan={5}
        onOffsetChange={offset => {
          debounceChangeOffset.run(offset)
        }}
        getKey={i => i.id}
        ref={virtualizerRef}
        style={{ width: '100%', height: '100%', overflowAnchor: 'none' }}
        estimateSize={200}
        items={sortedLabels.filter(i => i)}
        renderItem={i => renderItem(i, currentHighlight === i.id)}
      ></VirtualList>
    )
  }
  const renderSearch = () => (
    <input
      className={'focus-input border-box-shadow font-size-14'}
      style={{ padding: '4px 8px', borderRadius: 4, flex: 1 }}
      defaultValue={labelSearch.searchInput}
      onChange={e => {
        if (e.target.hasAttribute('composing')) {
          return
        }
        setLabelSearch(s => ({ ...s, searchInput: e.target.value }))
      }}
      placeholder={t('general.search')}
      onCompositionStart={e => {
        e.currentTarget.setAttribute('composing', 'true')
      }}
      onCompositionEnd={e => {
        e.currentTarget.removeAttribute('composing')
        setLabelSearch(s => ({ ...s, searchInput: e.currentTarget.value }))
      }}
    ></input>
  )

  return {
    renderSort,
    renderContainer,
    renderSearch,
    setCurrentHighlight,
    sortedLabels,
    virtualizerRef
  }
}
