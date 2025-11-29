import classnames from 'classnames'
import { css } from '@emotion/css'
import { ObjectStore } from '@/api/stores'
import { memo, useLayoutEffect } from 'react'
import { Icon, IconWithPopover } from '@/components'
import ContextMenu from '@/components/contextMenu'
import { orderBy, sum } from 'lodash'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { IPodcast, IPodcastFolder } from '~/typings'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import PodcastMenu from '@/core/components/podcast/menu/PodcastMenu'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import { DateFormat } from '@/utils'
import PodcastFolderMenu from '@/core/components/podcast/components/PodcastFolderMenu'
import { Icons } from '@/consts'

const RowClass = classnames([
  css({
    clipPath: 'xywh(0 0 100% 100% round 0.4rem)'
  }),
  'button none-select [&_td]:py-1.5 [&_td]:px-2 [&_td]:h-full'
])
export default memo(
  ({
    parentFolderId,
    cacheKey,
    type,
    items: ids,
    totalCountMode = 'episode'
  }: {
    items?: number[]
    parentFolderId?: number
    type: 'folder' | 'podcast'
    cacheKey: string
    totalCountMode?: 'podcast' | 'episode'
  }) => {
    const data = usePodcastData()
    const cache = data.libraryCache[`${cacheKey}_${type}`] ?? {
      sort: 'nameDsc'
    }
    const instance = usePodcastInstance()
    const sort = cache.sort ?? 'nameDsc'
    const items = ObjectStore(type === 'podcast' ? 'podcast' : 'podcastFolder').useMultiple(ids)
    const updateCache = (updater: (curr: typeof cache) => typeof cache) => {
      usePodcastData.updateData(curr => ({ ...curr, libraryCache: { ...curr.libraryCache, [`${cacheKey}_${type}`]: updater(cache) } }))
    }
    const sorted = cache.sorted ?? []
    useLayoutEffect(() => {
      const action = async () => {
        let beforeSorted: typeof sorted = []
        if (type === 'folder') {
          const normalizedFolders = await Promise.all(
            items.map(async f => {
              const podcasts = await ObjectStore('podcast').getMultipleByIds((f as IPodcastFolder).podcasts ?? [])
              const sortedPodcasts = orderBy(podcasts, i => i.lastUpdated ?? -1, 'desc')
              const lastUpdated = sortedPodcasts[0]?.lastUpdated
              const image = sortedPodcasts[0]?.thumbnail
              return {
                folder: f,
                lastUpdated,
                image: f.thumbnail ?? image,
                total: totalCountMode === 'podcast' ? podcasts.length : sum(podcasts.map(i => i.episodes.length))
              }
            })
          )
          beforeSorted = normalizedFolders.map(i => ({
            name: i.folder.name,
            icon: Icons.Folder,
            image: i.image,
            updatedAt: i.lastUpdated,
            createdAt: i.folder.createdAt,
            id: i.folder.id,
            type: 'folder',
            total: i.total
          }))
        }
        if (type === 'podcast') {
          beforeSorted = (items as IPodcast[]).map(i => ({
            name: i.name,
            image: i.thumbnail,
            id: i.id,
            icon: 'park-fm',
            updatedAt: i.lastUpdated,
            createdAt: i.followedAt,
            viewAt: i.viewAt ?? -1,
            type: 'podcast',
            total: i.episodes.length
          }))
        }
        switch (sort) {
          case 'nameAsc':
            beforeSorted = orderBy(beforeSorted, i => i.name, 'asc')
            break
          case 'nameDsc':
            beforeSorted = orderBy(beforeSorted, i => i.name, 'desc')
            break
          case 'createAsc':
            beforeSorted = orderBy(beforeSorted, i => i.createdAt, 'asc')
            break
          case 'createDsc':
            beforeSorted = orderBy(beforeSorted, i => i.createdAt, 'desc')
            break
          case 'totalAsc':
            beforeSorted = orderBy(beforeSorted, i => i.total, 'asc')
            break
          case 'totalDsc':
            beforeSorted = orderBy(beforeSorted, i => i.total, 'desc')
            break
          case 'updateAsc':
            beforeSorted = orderBy(beforeSorted, i => i.updatedAt, 'desc')
            break
          case 'updateDsc':
            beforeSorted = orderBy(beforeSorted, i => i.updatedAt, 'desc')
            break
        }
        updateCache(c => ({ ...c, sorted: beforeSorted }))
      }
      action()
    }, [sort, items])
    const { t } = useTranslation()
    const renderThead = (type: 'name' | 'total' | 'update' | 'create') => {
      let transKey = trans.Name
      if (type === 'update') {
        transKey = 'podcast.Update time'
      }
      if (type === 'total') {
        transKey = totalCountMode === 'podcast' ? 'podcast.Podcasts' : 'podcast.Episodes'
      }
      if (type === 'create') {
        transKey = 'podcast.Follow time'
      }
      return (
        <td key={type}>
          <div
            onClick={() => {
              if (sort === `${type}Dsc`) {
                updateCache(c => ({ ...c, sort: `${type}Asc` }))
                return
              }
              if (sort === `${type}Asc`) {
                updateCache(c => ({ ...c, sort: `${type}Dsc` }))
                return
              }
              updateCache(c => ({ ...c, sort: `${type}Dsc` }))
            }}
            className={classnames('flex pb-1 items-center w-fit cursor-pointer gap-2 capitalize', type === 'name' ? 'pl-2' : 'pl-2')}
          >
            {t(transKey)}
            {sort === `${type}Dsc` ? (
              <Icon strokeWidth={4} name={'park-down'} size={12} className={'transparent-font'} />
            ) : sort === `${type}Asc` ? (
              <Icon strokeWidth={4} name={'park-up'} size={12} className={'transparent-font'} />
            ) : null}
          </div>
        </td>
      )
    }
    return (
      <>
        {sorted.length ? (
          <>
            <table border={0} cellPadding={0} cellSpacing={0} className={'w-full'}>
              <colgroup>
                <col width={'50%'}></col>
                <col width={'15%'}></col>
                <col width={'15%'}></col>
                <col width={'15%'}></col>
                <col width={'40px'}></col>
              </colgroup>
              <thead className={'transparent-font font-medium font-size-12'}>
                <tr>{['name', 'total', 'create', 'update'].map(i => renderThead(i))}</tr>
              </thead>
              <tbody>
                {sorted.map((i, idx) => (
                  <ContextMenu
                    key={i.id}
                    content={setV =>
                      type === 'podcast' ? (
                        <PodcastMenu parentFolderId={parentFolderId} type={'podcast'} id={i.id} onClose={() => setV(false)} />
                      ) : (
                        <PodcastFolderMenu id={i.id} onClose={() => setV(false)} />
                      )
                    }
                  >
                    <tr
                      onClick={() => {
                        if (type === 'podcast') {
                          instance.actionOps?.openPodcast?.(i.id)
                        } else {
                          instance.actionOps?.openFolder?.(i.id)
                        }
                      }}
                      className={classnames(RowClass, 'h-12')}
                    >
                      <td>
                        <div className={'h-full flex items-center gap-2'}>
                          {i.icon && !i.image && <Icon className={'icon-22 h-10 flex items-center justify-center'} name={i.icon} />}
                          {i.image && <img className={'rounded object-cover w-10 h-10'} src={i.image} />}
                          <div className={classnames('ml-1', !i.name && 'super-transparent-font')}>{i.name || t(trans.Unnamed)}</div>
                        </div>
                      </td>
                      <td className={'font-size-12 transparent-font'}>
                        <div className={'h-full flex items-center'}>{i.total}</div>
                      </td>
                      <td className={'font-size-12 transparent-font'}>
                        <div className={'h-full flex items-center'}>{i.createdAt ? DateFormat.formatDate(i.createdAt) : undefined}</div>
                      </td>
                      <td className={'font-size-12 transparent-font'}>
                        <div className={'h-full flex items-center'}>{i.updatedAt ? DateFormat.formatDate(i.updatedAt) : undefined}</div>
                      </td>
                      <td className={'font-size-12 transparent-font min-w-12'}>
                        <div className={'h-full flex w-full justify-center items-center'}>
                          <IconWithPopover
                            placement={['bottom']}
                            onClick={e => e.stopPropagation()}
                            content={setV =>
                              type === 'podcast' ? (
                                <PodcastMenu parentFolderId={parentFolderId} type={'podcast'} id={i.id} onClose={() => setV(false)} />
                              ) : (
                                <PodcastFolderMenu id={i.id} onClose={() => setV(false)} />
                              )
                            }
                            name={Icons.More}
                            className={'icon-18 super-transparent-font'}
                          />
                        </div>
                      </td>
                    </tr>
                  </ContextMenu>
                ))}
              </tbody>
            </table>
            <div className={'pb-40'}></div>
          </>
        ) : (
          <div className={'w-full flex items-center justify-center grow font-semibold transparent-font'}>{t(trans.NoResult)}</div>
        )}
      </>
    )
  }
)
