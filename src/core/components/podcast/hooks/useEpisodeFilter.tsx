import { ObjectStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useItemsFilter from '@/core/components/common/useItemsFilter'
import { noRepeatArray } from '@/utils'
import { orderBy } from 'lodash'
import { IEpisode } from '~/typings'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
export default (
  currItems: number[] | undefined,
  id: number | string | undefined,
  filters?: Partial<{
    listened: boolean
    unlistened: boolean
    isObject: boolean
    hasHighlight: boolean
  }>,
  podcastGroup?: boolean
) => {
  const { t } = useTranslation()

  const { state, setState, renderSearch, finalResults, renderGrouperChooser, renderFilter } = useItemsFilter<IEpisode>(currItems, `${id}`, {
    itemType: 'episode',
    filters,
    searchKeys: ['name', 'description'],
    customFilters: [
      filters?.unlistened && {
        value: 'unlistened',
        text: t(trans.Feed.Unlistened)
      },
      filters?.listened && {
        value: 'listened',
        text: t(trans.Feed.Listened)
      }
    ].filter(i => i),
    getCustomFilter: async (v, items) => {
      const his = usePodcastData.getData().history ?? []
      const historySet = new Set(his.map(i => i.id))
      if (v === 'listened') {
        return items.filter(i => historySet.has(i.id)).map(i => i.id)
      }
      if (v === 'unlistened') {
        return items.filter(i => !historySet.has(i.id)).map(i => i.id)
      }
      return items.map(i => i.id)
    },
    getURL: i => i.enclosureURL,
    grouperOpts: {
      getCustomGrouper: async (v, episodes: IEpisode[]) => {
        if (v === 'podcast') {
          const podcastIdToEpisodes = new Map<number, number[]>()
          episodes.forEach(v => {
            if (v.podcastId) {
              podcastIdToEpisodes.set(v.podcastId, [...(podcastIdToEpisodes.get(v.podcastId) ?? []), v.id])
            }
          })
          const allPodcasts = await ObjectStore('podcast').getMultipleByIds(noRepeatArray(episodes.map(i => i.podcastId)))
          const sorted = orderBy(allPodcasts, i => podcastIdToEpisodes.get(i.id)?.length ?? 0, 'desc')
          return sorted.map(i => ({
            name: i.name ?? 'Unnamed podcast',
            image: i.thumbnail,
            count: podcastIdToEpisodes.get(i.id)?.length ?? 0,
            id: i.id,
            items: podcastIdToEpisodes.get(i.id) ?? []
          }))
        }
        return []
      },
      groupers: [
        ['none', t(trans.NoGrouping)],
        podcastGroup !== false ? ['podcast', t('general.Podcast')] : undefined,
        ['tag', t('general.Tag')],
        ['appearsIn', t(trans.AppearIn)]
      ]
        .filter(i => i)
        .map(i => ({ value: i[0], text: i[1] }))
    }
  })

  return {
    state,
    finalResults,
    setState,
    renderFilter,
    renderSearch,
    renderGrouperChooser
  }
}
