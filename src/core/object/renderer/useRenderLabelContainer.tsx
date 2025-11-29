import { ILabel, ILabelContainerProps, IMediaLabel, IPDFLabel } from '~/typings'
import { ReactElement, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounceFn, useUpdateEffect } from '@/hooks'
import fuzzysort from 'fuzzysort'
import { MetaStore, ObjectStore } from '@/api/stores'
import { BetterInput, Icon, IconWithPopover, Menu, VirtualList, WithBorder, Virtualizer, Button, Modal, AnimatePopover } from '@/components'
import { Path } from 'slate'
import { Icons } from '@/consts'
import classnames from 'classnames'
import trans from '@/consts/trans'
import EmptyList from '@/core/components/common/EmptyList'
import { compareStrings, Id, noRepeatArray } from '@/utils'
import produce from 'immer'
import ContextMenu from '@/components/contextMenu'
import LabelFilter from '@/core/object/renderer/LabelFilter'

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

const ICON_SIZE = 15
export default <T extends ILabel>(
  type: string,
  opts: {
    labelIds?: number[]
    labelState: ILabelContainerProps
    onLabelStateChange: (state: Partial<ILabelContainerProps>) => void
    availableSorts?: Required<ILabelContainerProps>['labelSortMode'][]
    getPathFromLabel?: (label: T) => Path | undefined
    onDelete: (id: number[]) => void
  }
) => {
  const {
    labelIds,
    onLabelStateChange,
    onDelete,
    labelState: {
      labelFolders,
      labelSortMode: sortMode = 'created at',
      labelScrollOffset: scrollOffset,
      labelPriority: priority,
      labelFilter: filter
    }
  } = opts
  const allLabels = ObjectStore(type).useMultiple(labelIds) as T[]
  const allLabelIds = useMemo(() => new Set(allLabels.map(i => i.id)), [allLabels])
  const { currentFolderLabels, notInFolderLabels } = useMemo(() => {
    const ids = new Set<number>()
    labelFolders?.folders.forEach(f => f.labels.forEach(l => ids.add(l)))
    const notInFolderLabels = labelIds?.filter(i => !ids.has(i)) || []
    let currentFolderLabels = notInFolderLabels
    if (labelFolders) {
      if (labelFolders.current) {
        const target = labelFolders.folders.find(i => i.id === labelFolders.current)
        if (target) {
          const ids = new Set(target.labels)
          currentFolderLabels = labelIds?.filter(i => ids.has(i)) || []
        }
      }
    }
    return { notInFolderLabels, currentFolderLabels }
  }, [labelFolders, labelIds])
  const currentLabels = ObjectStore(type).useMultiple(currentFolderLabels) as T[]
  const [showLabelContainer, setShowLabelContainer] = useState(false)
  const [sortedLabels, setSortedLabels] = useState<T[]>()
  const [currentHighlight, setCurrentHighlight] = useState<number>()
  const [searchVisible, setSearchVisible] = useState(false)
  const [currentMoveFolderLabelId, setCurrentMoveFolderLabelId] = useState<number>()
  const searchRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>()
  const scrolled = useRef(false)
  const previousLabelIds = useRef<number[]>()
  useLayoutEffect(() => {
    const prev = previousLabelIds.current
    previousLabelIds.current = labelIds
    if (labelIds && prev && labelIds.length > prev.length) {
      if (labelFolders?.current) {
        // we dont care about deleted labels
        const added = labelIds.filter(i => !prev.includes(i))
        onLabelStateChange({
          labelFolders: produce(labelFolders, draft => {
            const target = draft.folders.find(i => i.id === draft.current)
            if (target) {
              target.labels = noRepeatArray([...target.labels, ...added])
            }
          })
        })
      }
    }
  }, [labelIds])
  useLayoutEffect(() => {
    if (currentHighlight && labelFolders) {
      const targetFolder = labelFolders?.folders.find(i => i.labels.includes(currentHighlight))
      if (targetFolder && targetFolder.id !== labelFolders?.current) {
        onLabelStateChange({
          labelFolders: {
            ...labelFolders,
            current: targetFolder.id
          }
        })
      }
      if (!targetFolder && labelFolders.current) {
        onLabelStateChange({
          labelFolders: {
            ...labelFolders,
            current: undefined
          }
        })
      }
    }
    if (currentHighlight) {
      const targetIdx = sortedLabels?.findIndex(i => i.id === currentHighlight) ?? -1
      if (targetIdx >= 0) {
        setTimeout(() => virtualizerRef.current?.scrollToIndex(targetIdx, { align: 'center' }))
      }
    }
  }, [currentHighlight, sortedLabels])
  const debounceChangeOffset = useDebounceFn(
    (o: number) => {
      if (o !== scrollOffset) {
        onLabelStateChange({
          labelScrollOffset: o
        })
      }
    },
    { wait: 1000 }
  )
  const debounceSearch = useDebounceFn(
    (v: string) => {
      onLabelStateChange({
        labelFilter: {
          ...filter,
          search: v
        }
      })
    },
    { wait: 200 }
  )
  const triggerFilter = async () => {
    if (filter && labelIds) {
      let labels = currentLabels.slice()
      if (filter.search) {
        labels = fuzzysort
          .go(filter.search, labels, {
            keys: ['selectedText', 'name'],
            threshold: -1000000
          })
          .map(i => i.obj)
      }
      const colorSet = new Set(filter.color)
      const tagSet = new Set(filter.tag)
      labels = labels.filter(i => {
        if (filter.note !== undefined) {
          if (filter.note) {
            if (!i.name) return false
          }
          if (!filter.note) {
            if (i.name) return false
          }
        }
        if (colorSet.size) {
          if (!i.color || !colorSet.has(i.color)) return false
        }
        if (tagSet.size) {
          const tags = MetaStore.getMetaObjectByObjectId(i.id)?.tags
          if (!tags?.length) return false
          if (!tags.some(t => tagSet.has(t))) return false
        }
        return true
      })
      const ids = labels.map(i => i.id)
      triggerSort(ids)
    } else {
      triggerSort()
    }
  }
  const triggerSort = async (ids?: number[]) => {
    const idSet = new Set(ids)
    const labels = ids ? currentLabels.filter(i => idSet.has(i.id)) : currentLabels.slice()
    if (!filter?.search) {
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
              console.log(a, b, aPath, bPath)
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
        ;(labels as IPDFLabel[]).sort((b, a) => {
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
    console.log(labels)
    setSortedLabels(labels)
  }

  useLayoutEffect(() => {
    if (currentLabels.length) {
      triggerFilter()
    } else {
      setSortedLabels([])
    }
  }, [currentLabels, sortMode, priority, filter])
  // scroll to start when priority or sort mode change
  useUpdateEffect(() => {
    virtualizerRef.current?.scrollToIndex(0, { align: 'start' })
  }, [sortMode, priority])
  useEffect(() => {
    if (sortedLabels?.length && scrollOffset !== undefined && !scrolled.current) {
      virtualizerRef.current?.scrollToOffset(scrollOffset, { align: 'start' })
      scrolled.current = true
    }
  }, [sortedLabels])
  const renderFolderContainer = () => {
    return (
      <div className={classnames('flex-1 p-2 w-full overflow-y-auto', currentMoveFolderLabelId ? '' : 'pt-0')}>
        <div
          onClick={() => {
            if (labelFolders) {
              if (currentMoveFolderLabelId) {
                onLabelStateChange({
                  labelFolders: produce(labelFolders, draft => {
                    draft.folders.forEach(f => {
                      if (f.labels.includes(currentMoveFolderLabelId)) {
                        f.labels = f.labels.filter(i => i !== currentMoveFolderLabelId)
                      }
                    })
                  })
                })
                setCurrentMoveFolderLabelId(undefined)
                return
              }
              onLabelStateChange({
                labelFolders: {
                  ...labelFolders,
                  current: undefined
                }
              })
            }
            setTimeout(() => setShowLabelContainer(false))
          }}
          className={'button flex gap-3 items-center !rounded-xl !py-3 !px-4'}
        >
          <Icon className={'transparent-font'} size={20} name={Icons.ApplicationAll} />
          <div>{t('general.All highlights')}</div>
          <div className={'small-transparent ml-auto'}>{notInFolderLabels.length}</div>
        </div>
        {labelFolders?.folders
          .toSorted((a, b) => compareStrings(a.name, b.name))
          .map(i => (
            <FolderItem
              count={i.labels.filter(i => allLabelIds.has(i)).length}
              showMenu={currentMoveFolderLabelId === undefined}
              onClick={() => {
                if (labelFolders) {
                  if (currentMoveFolderLabelId) {
                    onLabelStateChange({
                      labelFolders: produce(labelFolders, draft => {
                        draft.folders.forEach(f => {
                          if (f.id === i.id) {
                            if (!f.labels.includes(currentMoveFolderLabelId)) {
                              f.labels = noRepeatArray([...f.labels, currentMoveFolderLabelId])
                            }
                          } else {
                            if (f.labels.includes(currentMoveFolderLabelId)) {
                              f.labels = f.labels.filter(i => i !== currentMoveFolderLabelId)
                            }
                          }
                        })
                      })
                    })
                    setCurrentMoveFolderLabelId(undefined)
                    return
                  }
                  onLabelStateChange({
                    labelFolders: {
                      ...labelFolders,
                      current: i.id
                    }
                  })
                  setTimeout(() => setShowLabelContainer(false))
                }
              }}
              onChange={name => {
                if (labelFolders) {
                  onLabelStateChange({
                    labelFolders: produce(labelFolders, draft => {
                      const item = draft.folders.find(o => o.id === i.id)
                      if (item) {
                        item.name = name
                      }
                    })
                  })
                }
              }}
              onDelete={() => {
                if (labelFolders) {
                  onDelete(i.labels)
                  onLabelStateChange({
                    labelFolders: produce(labelFolders, draft => {
                      draft.folders = draft.folders.filter(o => o.id !== i.id)
                      if (draft.current === i.id) {
                        draft.current = undefined
                      }
                    })
                  })
                }
              }}
              {...i}
              key={i.id}
            />
          ))}
        <div
          onClick={() => {
            Global.dialogOps
              ?.createOrEditFolder('custom', {
                name: ''
              })
              .then(res => {
                onLabelStateChange({
                  labelFolders: {
                    ...labelFolders,
                    folders: [
                      ...(labelFolders?.folders || []),
                      {
                        id: Id.getId(),
                        name: res.name,
                        labels: []
                      }
                    ]
                  }
                })
              })
          }}
          className={'transparent-font flex gap-3 items-center button !rounded-xl !py-3 !px-4'}
        >
          <Icon size={20} name={Icons.Create} />
          {t('general.New folder')}
        </div>
      </div>
    )
  }
  // @ts-ignore
  const renderSort = () => (
    <AnimatePopover
      positions={['bottom']}
      padding={6}
      content={setV => (
        <WithBorder className={'py-1 min-w-52'}>
          <Menu.NavigationMenu
            hoverBg
            keyboardNavigation={false}
            onSelect={v => {
              setV(false)
              if (v && v.type === 'item') {
                onLabelStateChange({
                  labelSortMode: v.key
                })
              }
            }}
            layout={[
              {
                type: 'title',
                name: t('general.Sort by')
              },
              // @ts-ignore
              ...(opts?.availableSorts?.map(i => ({
                type: 'item',
                key: i,
                text: t(SortToTranslation[i]),
                suffixIcon: i === sortMode ? 'park-check-small' : undefined
              })) || [])
            ]}
          />
          <Menu.NavigationMenu
            hoverBg
            keyboardNavigation={false}
            layout={[
              {
                type: 'title',
                name: t('general.Priority')
              },
              ...[
                {
                  key: 'note',
                  text: t('general.Note priority')
                },
                {
                  key: 'tag',
                  text: t('general.Tag priority')
                },
                {
                  key: 'none',
                  text: t('general.No priority')
                }
              ].map(i => ({
                type: 'item',
                key: i.key,
                text: i.text,
                suffixIcon: i.key === priority ? 'park-check-small' : undefined,
                onSelect: () => {
                  onLabelStateChange({
                    labelPriority: i.key
                  })
                  setV(false)
                }
              }))
            ]}
          />
        </WithBorder>
      )}
    >
      <Icon name={Icons.Sort} size={ICON_SIZE} className={'square-button'} />
    </AnimatePopover>
  )
  const renderMoveFolder = () => {
    return (
      <Modal visible={currentMoveFolderLabelId !== undefined} onClose={() => setCurrentMoveFolderLabelId(undefined)}>
        <div
          style={{
            minHeight: 320,
            maxHeight: 640,
            width: '32rem'
          }}
          className={'flex flex-col'}
        >
          <div className={'font-size-13 transparent-font w-full bg-third py-2 px-4'}>{t('general.Move to folder')}</div>
          {renderFolderContainer()}
        </div>
      </Modal>
    )
  }
  const renderContainer = (renderItem: (label: T, highlighted: boolean, onMove: VoidFunction) => ReactElement) => {
    console.log(sortedLabels)
    return (
      <>
        {renderMoveFolder()}
        {showLabelContainer ? (
          renderFolderContainer()
        ) : !sortedLabels?.length ? (
          <EmptyList className={'h-full'} />
        ) : (
          <VirtualList
            paddingEnd={50}
            overscan={3}
            onOffsetChange={offset => {
              debounceChangeOffset.run(offset)
            }}
            getKey={i => i.id}
            ref={virtualizerRef}
            style={{ width: '100%', height: '100%', overflowAnchor: 'none' }}
            estimateSize={200}
            items={sortedLabels.filter(i => i)}
            itemClassname={'not-last-not-empty-border-bottom'}
            renderItem={i => renderItem(i, currentHighlight === i.id, () => setCurrentMoveFolderLabelId(i.id))}
          ></VirtualList>
        )}
      </>
    )
  }
  const renderSearch = () => {
    return (
      <div className={'flex items-center'}>
        <Icon
          name={Icons.Search}
          onClick={() => {
            setSearchVisible(true)
            searchRef.current?.focus()
          }}
          className={'square-button'}
          size={ICON_SIZE}
        />
        <BetterInput
          onBlur={() => setSearchVisible(false)}
          ref={searchRef}
          placeholder={t(trans.Search)}
          style={{
            width: filter?.search || searchVisible ? 120 : 0,
            marginLeft: filter?.search || searchVisible ? 4 : 0,
            transition: 'width 0.16s ease'
          }}
          className={'font-size-13 h-5'}
          onChange={v => {
            debounceSearch.run(v.target.value)
          }}
          defaultValue={filter?.['search']}
        />
      </div>
    )
  }
  const renderHeader = ({ className }: { className?: string } = { className: '' }) => {
    if (showLabelContainer) {
      return (
        <div className={'flex items-center font-medium p-3 gap-3'}>
          <Icon
            onClick={() => setShowLabelContainer(false)}
            size={16}
            name={'park-arrow-left'}
            strokeWidth={4.5}
            className={'square-button transparent-icon'}
          />
          {t('general.Folders')}
        </div>
      )
    }
    if (!allLabels.length) return null
    const currentFolder = labelFolders?.current ? labelFolders.folders.find(i => i.id === labelFolders.current) : undefined
    return (
      <div className={classnames('flex items-center p-2 justify-between transparent-font', className)}>
        <div
          onClick={() => setShowLabelContainer(true)}
          className={'font-size-13 pl-1 hover-primary-color cursor-pointer transition-colors group flex items-center gap-1.5'}
        >
          {currentFolder ? currentFolder.name || t(trans.UnnamedFolder) : t('general.All highlights')}
          <Icon name={'park-down'} strokeWidth={4} />
        </div>
        <div className={'flex gap-1.5 items-center'}>
          {renderSearch()}
          <IconWithPopover
            name={Icons.Filter}
            placement={['bottom']}
            size={ICON_SIZE}
            className={classnames(
              'square-button',
              (filter?.color?.length || filter?.note !== undefined || filter?.tag?.length) && 'active-button'
            )}
            content={setV => (
              <WithBorder>
                <LabelFilter
                  value={filter}
                  labelIds={labelIds}
                  type={type}
                  onChange={v => {
                    onLabelStateChange({
                      labelFilter: v
                    })
                  }}
                />
              </WithBorder>
            )}
          />
          {renderSort()}
        </div>
      </div>
    )
  }
  return {
    renderSort,
    renderContainer,
    renderSearch,
    renderHeader,
    triggerSort,
    setCurrentHighlight,
    sortedLabels,
    virtualizerRef
  }
}

const FolderItem = ({
  name,
  id,
  onChange,
  onClick,
  onDelete,
  count,
  showMenu = true
}: {
  name: string
  id: number
  onChange: (name: string) => void
  onClick: VoidFunction
  onDelete: VoidFunction
  showMenu?: boolean
  count: number
}) => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const renderMenu = (setV: (v: boolean) => void) =>
    showMenu ? (
      <WithBorder onClick={e => e.stopPropagation()} className={'popover-menu-mid px-1'}>
        <Button.IconButton
          onClick={() => {
            setV(false)
            Global.dialogOps
              ?.createOrEditFolder('custom', {
                name
              })
              .then(res => onChange(res.name))
          }}
          icon={Icons.Edit}
          text={t(trans.Edit)}
        />
        <Button.IconButton
          onClick={() => {
            setV(false)
            onDelete()
          }}
          icon={Icons.Delete}
          text={t(trans.Delete)}
        />
      </WithBorder>
    ) : null
  return (
    <ContextMenu content={setV => renderMenu(setV)}>
      <div onClick={onClick} className={'button group relative flex gap-3 items-center !rounded-xl !py-3 !px-4'}>
        <Icon className={'transparent-font'} size={20} name={Icons.Folder} />
        <div className={classnames('line-clamp-1 mr-2', !name && 'super-transparent-font')}>{name || t(trans.Unnamed)}</div>
        <div
          style={{
            opacity: !showMenu ? 1 : visible ? 0 : undefined
          }}
          className={'small-transparent ml-auto group-hover:opacity-0 transition-opacity'}
        >
          {count}
        </div>
        {showMenu && (
          <IconWithPopover
            onVisiblityChange={v => setVisible(v)}
            size={18}
            name={Icons.More}
            onClick={e => e.stopPropagation()}
            style={{
              opacity: visible ? 1 : undefined
            }}
            content={setV => renderMenu(setV)}
            containerClassName={'!absolute right-4'}
            placement={['bottom']}
            className={'transparent-font opacity-0 transition-opacity group-hover:opacity-100'}
          ></IconWithPopover>
        )}
      </div>
    </ContextMenu>
  )
}
