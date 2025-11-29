import classnames from 'classnames'
import { css } from '@emotion/css'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import { ObjectStore } from '@/api/stores'
import { useNorepeatNavigate } from '@/hooks'
import { useLayoutEffect, useState } from 'react'
import { Icon, IconWithPopover } from '@/components'
import ContextMenu from '@/components/contextMenu'
import FeedCollectionMenu from '@/core/components/feed/components/FeedCollectionMenu'
import { orderBy, sum } from 'lodash'
import FeedFolderMenu from '@/core/components/feed/components/FeedFolderMenu'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { IFeedCollection, IFeedFolder } from '~/typings'
import { Icons } from '@/consts'
import { EmptyList } from '@/core/components/common'

const RowClass = classnames([
  css({
    clipPath: 'xywh(0 0 100% 100% round 0.4rem)'
  }),
  'button none-select [&_td]:py-2 [&_td]:px-2 [&_td]:h-full'
])
export default ({
  parentFolderId,
  cacheKey,
  type,
  items: ids
}: {
  items?: number[]
  parentFolderId?: number
  type: 'folder' | 'collection'
  cacheKey: string
}) => {
  const data = useFeedData()
  const cache = data.libraryCache[cacheKey] ?? {
    sort: 'nameDsc'
  }
  const sort = cache.sort ?? 'nameDsc'
  const items = ObjectStore(type === 'collection' ? 'feedCollection' : 'feedFolder').useMultiple(ids)
  const navigate = useNorepeatNavigate()
  const updateCache = (updater: (curr: typeof cache) => typeof cache) => {
    useFeedData.updateData(curr => ({ ...curr, libraryCache: { ...curr.libraryCache, [cacheKey]: updater(cache) } }))
  }
  const sorted = cache.sorted ?? []
  useLayoutEffect(() => {
    const action = async () => {
      const history = new Set<number>(useFeedData.getData().history.map(i => i.id))
      let beforeSorted: typeof sorted = []
      if (type === 'folder') {
        const folderWithCount = await Promise.all(
          items.map(async f => {
            const collections = await ObjectStore('feedCollection').getMultipleByIds((f as IFeedFolder).collections ?? [])
            return {
              folder: f,
              unread: sum(collections.map(i => i?.unreadCount ?? 0)) + (f.feeds?.filter(i => !history.has(i)).length ?? 0),
              total: sum(collections.map(i => i?.items.length ?? 0)) + (f.feeds?.length ?? 0)
            }
          })
        )
        beforeSorted = folderWithCount.map(i => ({
          name: i.folder.name || t(trans.Unnamed),
          icon: Icons.Folder,
          id: i.folder.id,
          total: i.total,
          unread: i.unread,
          type: 'folder'
        }))
      }
      if (type === 'collection') {
        beforeSorted = (items as IFeedCollection[]).map(i => ({
          name: i.name || 'Unnamed feed',
          image: i.icon === 'gNews' ? '/google-news.png' : i.icon,
          id: i.id,
          icon: 'park-broadcast',
          total: i.items?.length ?? 0,
          unread: i.unreadCount ?? 0,
          type: 'collection'
        }))
      }
      switch (sort) {
        case 'nameAsc':
          beforeSorted = orderBy(beforeSorted, i => i.name, 'asc')
          break
        case 'nameDsc':
          beforeSorted = orderBy(beforeSorted, i => i.name, 'desc')
          break
        case 'totalAsc':
          beforeSorted = orderBy(beforeSorted, i => i.total, 'asc')
          break
        case 'totalDsc':
          beforeSorted = orderBy(beforeSorted, i => i.total, 'desc')
          break
        case 'unreadAsc':
          beforeSorted = orderBy(beforeSorted, i => i.unread, 'asc')
          break
        case 'unreadDsc':
          beforeSorted = orderBy(beforeSorted, i => i.unread, 'desc')
          break
      }
      updateCache(c => ({ ...c, sorted: beforeSorted }))
    }
    action()
  }, [sort, items])
  const { t } = useTranslation()
  const renderThead = (type: 'name' | 'total' | 'unread') => {
    let transKey = trans.Name
    if (type === 'total') {
      transKey = trans.Feed.Contents
    }
    if (type === 'unread') {
      transKey = trans.Feed.Unread
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
          className={classnames('flex items-center w-fit cursor-pointer gap-2 capitalize', type === 'name' ? 'pl-3' : 'pl-2')}
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
          <table className={'w-full -mx-3'}>
            <colgroup>
              <col width={'80%'}></col>
              <col width={'10%'}></col>
              <col width={'10%'}></col>
              <col width={'40px'}></col>
            </colgroup>
            <thead className={'transparent-font font-medium font-size-12'}>
              <tr>{['name', 'total', 'unread'].map(i => renderThead(i))}</tr>
            </thead>
            <tbody>
              {sorted.map((i, idx) => (
                <ContextMenu
                  key={i.id}
                  content={setV =>
                    type === 'collection' ? (
                      <FeedCollectionMenu parentFolderId={parentFolderId} id={i.id} onClose={() => setV(false)} />
                    ) : (
                      <FeedFolderMenu id={i.id} onClose={() => setV(false)} />
                    )
                  }
                >
                  <tr
                    onClick={() => {
                      if (type === 'collection') {
                        navigate(`/feed/collection/${i.id}`)
                      } else {
                        navigate(`/feed/folder/${i.id}`)
                      }
                    }}
                    className={classnames(RowClass, 'h-12')}
                  >
                    <td>
                      <div className={'h-full flex items-center gap-2'}>
                        {i.icon && !i.image && <Icon className={'icon-22 w-10 h-10 flex items-center justify-center'} name={i.icon} />}
                        {i.image && <img className={'rounded object-cover w-10 h-10'} src={i.image} />}
                        <div className={'ml-1'}>{i.name}</div>
                      </div>
                    </td>
                    <td className={'font-size-12 transparent-font'}>
                      <div className={'h-full flex items-center'}>{i.total}</div>
                    </td>
                    <td className={'font-size-12 transparent-font'}>
                      <div className={'h-full flex items-center'}>{i.unread}</div>
                    </td>
                    <td className={'font-size-12 transparent-font min-w-12'}>
                      <div className={'h-full flex w-full justify-center items-center'}>
                        <IconWithPopover
                          placement={['bottom']}
                          onClick={e => e.stopPropagation()}
                          content={setV =>
                            type === 'collection' ? (
                              <FeedCollectionMenu parentFolderId={parentFolderId} id={i.id} onClose={() => setV(false)} />
                            ) : (
                              <FeedFolderMenu id={i.id} onClose={() => setV(false)} />
                            )
                          }
                          name={Icons.More}
                          className={'super-transparent-font'}
                        />
                      </div>
                    </td>
                  </tr>
                </ContextMenu>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <EmptyList />
      )}
    </>
  )
}
