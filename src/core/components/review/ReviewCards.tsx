import React, { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BetterInput, CheckBox, Icon, IconWithPopover, Menu, TabPane, Tabs, ToolbarV2, WithBorder } from '@/components'
import { Icons } from '@/consts'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { IReviewCard, IReviewDue, MetaFilterGroup } from '~/typings'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import { useUpdate } from 'react-use'
import useReviewState from '@/core/components/review/useReviewState'
import useReviewInstance from '@/core/components/review/useReviewInstance'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import { ReviewHistoryItem } from '@/core/components/review/home/RecentlyCards'
import { useDebounceFn } from '@/hooks'
import { Tab } from '@/components/base/tabs'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { createEmptyCard } from 'ts-fsrs'
import NoResult from '@/core/components/common/NoResult'
import ReviewStore from '@/api/stores/review.store'
const getTime = (d?: Date | number) => {
  if (!d) return 0
  if (typeof d === 'number') return d
  return d.getTime()
}
export default memo(() => {
  const reviewState = useReviewState()
  const [selectedReviewState, setSelectedReviewState] = useState<'all' | 'ignored' | IReviewDue>(reviewState.cardLibraryView)
  const categorized = useMemo(() => {
    const categorized = reviewState.categorized
    const now = new Date()
    return {
      total: categorized.review.length + categorized.relearning.length + categorized.new.length + categorized.learning.length,
      ...categorized,
      scheduled: reviewState.scheduledCards,
      history: Object.values(reviewState.history)
        .flat()
        .map(i => ({
          card: i,
          metaId: (i.metaId || reviewState.cardIdToMetaIdMap.get(i.id))!
        }))
        .filter(i => i.metaId),
      ignored: reviewState.ignored.map(i => ({ metaId: i, card: reviewState.metaIdToCardMap.get(i) || createEmptyCard(now) })),
      all: [...categorized.new, ...categorized.learning, ...categorized.review, ...categorized.relearning]
    }
  }, [reviewState.categorized, reviewState.scheduledCards, reviewState.history])
  const update = useUpdate()
  const [selected, setSelected] = useState<number[]>([])
  const [filterSearch, setFilterSearch] = useState<{
    search?: string
    filter?: MetaFilterGroup
    result?: number[]
  }>({})
  useLayoutEffect(() => {
    update()
  }, [])
  const instance = useReviewInstance()
  const renderToolbar = () => {
    if (selected.length) {
      const hasIgnoredSelected = selected.some(i => reviewState.metaIdToCardMap.get(i)?.ignored)
      return (
        <WithBorder className={'!absolute z-20 bottom-6 left-1/2 -translate-x-1/2'}>
          <ToolbarV2
            layout={[
              {
                type: 'button',
                key: 'close',
                icon: 'park-close',
                element: (
                  <div className={'flex transparent-font font-size-13 items-center gap-1.5 pr-2 pl-1'}>
                    <Icon size={13} strokeWidth={4} className={'square-button-small'} name={Icons.Close} onClick={() => setSelected([])} />
                    <div>{t('review.Cards selected', { num: selected.length })}</div>
                  </div>
                )
              },
              // @ts-ignore
              ...(hasIgnoredSelected
                ? []
                : [
                    {
                      type: 'separator',
                      key: 's-1'
                    },
                    {
                      type: 'button',
                      key: 'mark',
                      popover: setV => (
                        <WithBorder className={'py-1 min-w-56'}>
                          <Menu.NavigationMenu
                            layout={['easy', 'good', 'hard', 'again'].map(i => ({
                              type: 'item',
                              key: i,
                              onSelect: () => {
                                setV(false)
                                ReviewStore.reviewCard(selected, i).then(() => {
                                  instance.index?.(true)
                                })
                                setSelected([])
                              },
                              text: `${ReviewConsts.emojis[i]}\xa0\xa0${t(ReviewConsts.trans[i])}`
                            }))}
                          />
                        </WithBorder>
                      ),
                      text: t('review.Mark as'),
                      icon: 'park-check-one'
                    }
                  ]),
              {
                type: 'button',
                key: 'reset',
                icon: 'park-undo',
                text: t('review.Reset study progress'),
                onClick: () => {
                  ReviewStore.resetProgress(selected).then(() => {
                    instance.index?.(true)
                  })
                  setSelected([])
                }
              },
              {
                type: 'button',
                key: 'ignore',
                text: hasIgnoredSelected ? t('review.Unignore') : t('review.Ignore'),
                icon: 'park-forbid',
                onClick: () => {
                  if (hasIgnoredSelected) {
                    instance.unignore?.(selected)
                  } else {
                    instance.ignoreScheduledCard?.(selected)
                  }
                  setSelected([])
                }
              }
            ]}
          ></ToolbarV2>
        </WithBorder>
      )
    }
  }
  const currentCategorized = categorized[selectedReviewState]
  const { t } = useTranslation()
  const [final, setFinal] = useState<
    {
      card?: IReviewCard
      metaId: number
    }[]
  >([])
  useLayoutEffect(() => {
    const action = async () => {
      if (!filterSearch.search && !filterSearch.filter?.rules.length) {
        setFilterSearch(s => ({ ...s, result: undefined }))
        return
      }
      let all = reviewState.currentMetas
      if (filterSearch.search) {
        all = (
          await Global.metaOps.search(filterSearch.search, all, {
            showHidden: true,
            showLabel: true
          })
        ).map(i => i.id)
      }
      if (filterSearch.filter?.rules.length) {
        all = (await Global.metaOps.filter(filterSearch.filter, all))?.map(i => i.id) || []
      }
      setFilterSearch(s => ({ ...s, result: all }))
    }
    action()
  }, [reviewState.currentMetas, filterSearch.search, filterSearch.filter])
  useLayoutEffect(() => {
    const allMetas = new Set(filterSearch.result || reviewState.currentMetas)
    setFinal(
      currentCategorized.filter(i => allMetas.has(i.metaId)).sort((a, b) => getTime(b.card?.last_review) - getTime(a.card?.last_review))
    )
  }, [filterSearch.result, currentCategorized])
  const debounceChange = useDebounceFn(v => setFilterSearch(s => ({ ...s, search: v })), { wait: 200 })
  const scrollEleRef = useRef<HTMLDivElement>(null)
  const finalCategory = useMemo(() => {
    const finalMetaIds = new Set(filterSearch.result || reviewState.currentMetas)
    const res = {
      new: categorized.new.filter(i => finalMetaIds.has(i.metaId)),
      learning: categorized.learning.filter(i => finalMetaIds.has(i.metaId)),
      relearning: categorized.relearning.filter(i => finalMetaIds.has(i.metaId)),
      review: categorized.review.filter(i => finalMetaIds.has(i.metaId)),
      ignored: categorized.ignored.filter(i => finalMetaIds.has(i.metaId)),
      scheduled: categorized.scheduled.filter(i => finalMetaIds.has(i.metaId)),
      history: categorized.history.filter(i => finalMetaIds.has(i.metaId))
    }
    return {
      ...res,
      all: [...res.new, ...res.relearning, ...res.review, ...res.learning]
    }
  }, [categorized, reviewState.currentMetas, filterSearch.result])
  const tempFilter = useRef<MetaFilterGroup>()
  const [isEditing, setIsEditing] = useState(false)
  return (
    <div ref={scrollEleRef} className={'w-full overflow-y-auto h-full px-6'}>
      {renderToolbar()}
      <div className={'container-5xl pt-9 pb-20 flex flex-col min-h-full'}>
        <div className={'flex justify-between items-start mb-6 pl-2'}>
          <div className={'font-bold text-4xl'}>{t('review.Cards overview')}</div>
          <div className={'flex justify-between items-center gap-3 py-2'}>
            <div
              style={{
                padding: 'calc(0.375rem + 1px) 0.625rem'
              }}
              className={'border-box-shadow w-64 focus-within-input rounded-lg gap-2 flex'}
            >
              <Icon size={16} name={Icons.Search} />
              <BetterInput onChange={e => debounceChange.run(e.target.value)} className={'flex-1'} />
            </div>
            <IconWithPopover
              placement={['bottom']}
              padding={6}
              onVisiblityChange={v => {
                if (v === false && filterSearch.filter !== tempFilter.current) {
                  setFilterSearch(s => ({ ...s, filter: tempFilter.current }))
                }
              }}
              content={setV => (
                <WithBorder>
                  <BetterFilter
                    currentMetas={reviewState.currentMetas}
                    root={filterSearch.filter}
                    onChange={v => (tempFilter.current = v)}
                  />
                </WithBorder>
              )}
              size={16}
              className={classnames('border flex items-center !p-2.5 button', filterSearch.filter?.rules.length && 'active-button')}
              name={Icons.Filter}
            />
            <Icon
              size={16}
              onClick={() => {
                setIsEditing(!isEditing)
                if (isEditing) {
                  setSelected([])
                }
              }}
              name={Icons.Edit}
              className={classnames('border !p-2.5 button', isEditing && 'active-button')}
            />
          </div>
        </div>
        <div className={'sticky bg-global top-0 pb-1 z-20 pl-2'}>
          <Tabs
            tabNavClassname={'shrink-0 !px-3.5 !pt-2 !pb-1.5'}
            activeKey={selectedReviewState}
            onTabClick={k => {
              setSelectedReviewState(k)
              setSelected([])
            }}
            tabNavMode={'underline'}
            tabNavLeftClassName={'no-scrollbar overflow-x-auto !flex-nowrap'}
            tabNavContainerClassname={'border-bottom'}
          >
            {[
              ['all', t('general.all')],
              ['scheduled', t("review.Today's goal")],
              ['history', t(trans.History)],
              ['new', t(ReviewConsts.trans.new)],
              ['learning', t(ReviewConsts.trans.learning)],
              ['review', t(ReviewConsts.trans.review)],
              ['relearning', t(ReviewConsts.trans.relearning)],
              ['ignored', t(ReviewConsts.trans.ignored)]
            ].map(i => (
              <TabPane tab={<Tab text={i[1]} count={finalCategory[i[0]].length} />} key={i[0]}>
                {null}
              </TabPane>
            ))}
          </Tabs>
          {final.length ? (
            <div className={'flex font-size-12 gap-5 mt-3 transparent-font'}>
              {isEditing && (
                <div className={'w-4 flex items-center'}>
                  <CheckBox
                    onChange={() => {
                      if (selected.length > 0 && selected.length < final.length) {
                        setSelected(final.map(i => i.metaId))
                        return
                      }
                      if (selected.length >= final.length) {
                        setSelected([])
                        return
                      }
                      setSelected(final.map(i => i.metaId))
                    }}
                    checked={selected.length >= final.length}
                    indeterminate={selected.length > 0 && selected.length < final.length}
                  />
                </div>
              )}
              <div
                style={{
                  width: 180
                }}
              >
                {t('review.Studied at')}
              </div>
              <div
                style={{
                  width: 120
                }}
              >
                {t('review.Rating')}
              </div>
              <div
                style={{
                  width: 120
                }}
              >
                {t('general.type')}
              </div>
              <div
                style={{
                  flex: 1
                }}
              >
                {t(trans.Name)}
              </div>
            </div>
          ) : null}
        </div>
        {final.length ? (
          <VirtualLoader
            scrollElementRef={scrollEleRef}
            count={final.length}
            size={32}
            overscan={8}
            renderItem={idx => {
              const i = final[idx]
              if (i) {
                return (
                  <ReviewHistoryItem
                    selected={selected.includes(i.metaId)}
                    onSelect={
                      isEditing
                        ? () => {
                            setSelected(s => (s.includes(i.metaId) ? s.filter(o => o !== i.metaId) : [...s, i.metaId]))
                          }
                        : undefined
                    }
                    card={i.card}
                    metaId={i.metaId}
                    key={i.metaId}
                  />
                )
              }
              return null
            }}
          />
        ) : (
          <NoResult />
        )}
      </div>
    </div>
  )
})
