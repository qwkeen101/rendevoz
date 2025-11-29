import { ObjectStore } from '@/api/stores'
import { IFeedItem } from '~/typings'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useItemsFilter from '@/core/components/common/useItemsFilter'
import { noRepeatArray } from '@/utils'
import { orderBy } from 'lodash'

export default (
  currItems: number[] | undefined,
  id: number | string | undefined,
  filters?: Partial<{
    read: boolean
    unread: boolean
    isObject: boolean
    hasHighlight: boolean
  }>,
  feedGroup?: boolean
) => {
  const { t } = useTranslation()

  const history = useFeedData().history
  const { renderFilter, renderSearch, renderGrouperChooser, finalResults, state, setState } = useItemsFilter<IFeedItem>(currItems, id, {
    itemType: 'feed',
    getURL: i => i.link,
    filters,
    searchKeys: ['title', 'description'],
    customFilters: [
      // @ts-ignore
      filters?.unread
        ? {
            text: t(trans.Feed.Unread),
            value: 'unread'
          }
        : undefined,
      // @ts-ignore
      filters?.read
        ? {
            text: t(trans.Feed.Read),
            value: 'read'
          }
        : undefined
    ].filter(i => i),
    getCustomFilter: async (v, items) => {
      const historySet = new Set(history.map(i => i.id))
      switch (v) {
        case 'read':
          return items.filter(i => i && historySet.has(i.id)).map(i => i.id)
        case 'unread':
          return items.filter(i => i && !historySet.has(i.id)).map(i => i.id)
      }
      return []
    },
    grouperOpts: {
      getCustomGrouper: async (v, feeds: IFeedItem[]) => {
        if (v === 'feed') {
          const collectionIdToFeeds = new Map<number, number[]>()
          feeds.forEach(v => {
            if (v.collectionId) {
              collectionIdToFeeds.set(v.collectionId, [...(collectionIdToFeeds.get(v.collectionId) ?? []), v.id])
            }
          })
          const allCollections = await ObjectStore('feedCollection').getMultipleByIds(noRepeatArray(feeds.map(i => i.collectionId)))
          const sorted = orderBy(allCollections, i => collectionIdToFeeds.get(i.id)?.length ?? 0, 'desc')
          return sorted.map(i => ({
            name: i.name ?? 'Unnamed feed',
            count: collectionIdToFeeds.get(i.id)?.length ?? 0,
            id: i.id,
            items: collectionIdToFeeds.get(i.id) ?? []
          }))
        }
        return []
      },
      groupers: [['none', t(trans.NoGrouping)], feedGroup !== false ? ['feed', t(trans.Feed.feed)] : undefined, ['tag', t('general.Tag')]]
        .filter(i => i)
        .map(i => ({ value: i[0], text: i[1] }))
    }
  })

  return {
    state,
    setState,
    finalResults,
    renderFilter,
    renderSearch,
    renderGrouperChooser
  }
}
