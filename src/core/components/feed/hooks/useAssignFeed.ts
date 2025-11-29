import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { assignProperties } from '@/utils'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import universalFeedFetcher from '@/core/components/feed/utils/universalFeedFetcher'
import fetchFeedAndAddCollection from '@/core/components/feed/utils/fetchFeedAndAddCollection'
import { GroupStore, MetaStore, ObjectStore } from '@/api/stores'
import transformItemsIntoMetas from '@/core/components/feed/utils/service/transformItemsIntoMetas'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export default () => {
  const instance = useFeedInstance()
  const { t } = useTranslation()
  assignProperties(instance, {
    load: e => {
      if (e.type === 'google') {
        instance.feedOps?.navigate(`/loading?type=google`, { state: e.news })
      }
    },
    feedOps: {
      ...instance.feedOps,
      deleteCollection: async id => {
        const feedCollection = await ObjectStore('feedCollection').fetchOneById(id)
        if (feedCollection) {
          await ObjectStore('feedCollection').deleteOneById(id)
          feedCollection.items?.forEach(i => {
            ObjectStore('feed').deleteOneById(i)
          })
        }
      },
      readLater: id => {
        const data = useFeedData.getData()
        if (data.readLater?.includes(id)) {
          useFeedData.updateData(c => ({ ...c, readLater: c.readLater?.filter(i => i! == id) }))
        } else {
          toast.success(t(trans.Feed.MovedToReadLater))
          useFeedData.updateData(c => ({ ...c, readLater: [id, ...(c.readLater ?? [])] }))
        }
      },
      follow: async (id, shouldToast = true) => {
        const data = useFeedData.getData()
        if (data.followedItems?.includes(id)) {
          ObjectStore('feed').updateOne({ id, followed: false })
          useFeedData.updateData(c => ({ ...c, followedItems: c.followedItems?.filter(i => i !== id) }))
        } else {
          shouldToast && toast.success(t(trans.Success.FollowedSuccessfully))
          ObjectStore('feed').updateOne({ id, followed: true })
          useFeedData.updateData(c => ({ ...c, followedItems: [id, ...(c.followedItems ?? [])] }))
        }
      },
      refreshCollectionContent: async id => {
        let collection = await ObjectStore('feedCollection').fetchOneById(id)
        if (collection && collection.feedUrl) {
          const res = await universalFeedFetcher(collection.feedUrl, collection.collectionType)
          if (!res) return
          collection = await ObjectStore('feedCollection').fetchOneById(id)
          if (collection) {
            const allItemUrls = await Promise.all(collection.items.map(async id => await ObjectStore('feed').fetchOneById(id)))
            const alreadyUrls = new Set(allItemUrls.map(i => i?.link))
            const filteredItems = res.items.filter(i => !alreadyUrls.has(i.link))
            const newItemIds = await Promise.all(filteredItems.map(async item => ObjectStore('feed').addOne({ ...item, collectionId: id })))
            if (collection.relatedGroups?.length) {
              const newMetas = await transformItemsIntoMetas(newItemIds.map(i => i.id))
              collection.relatedGroups.forEach(i => {
                const m = MetaStore.getCachedMetaObject(i)
                if (m && !m.deleted) {
                  GroupStore.insertMetaIntoGroup(
                    newMetas.map(i => i.id),
                    m.objectId!
                  )
                }
              })
            }
            ObjectStore('feedCollection').updateOne({
              id,
              items: [...newItemIds.map(i => i.id), ...collection.items],
              lastFetchedAt: Date.now(),
              unreadCount: (collection.unreadCount ?? 0) + newItemIds.length
            })
          }
        }
      },
      importRssAsCollection: (url, folderId, opts) => fetchFeedAndAddCollection(url, 'webpage', folderId, opts),
      read: async id => {
        const feed = await ObjectStore('feed').getOneById(id)
        if (!feed) return
        instance.feedOps?.navigate(`/loading?type=feed&id=${id}`)
        const history = useFeedData.getData().history
        useFeedData.addFeedToHistory(id)
        ObjectStore('feed').updateOne({ id, viewAt: Date.now() })
        if (feed && feed.collectionId) {
          const collection = await ObjectStore('feedCollection').fetchOneById(feed.collectionId)
          if (collection) {
            const historySet = new Set(history.map(i => i.id))
            const unread = collection?.items.filter(i => !historySet.has(i)).length ?? 0
            ObjectStore('feedCollection').updateOne({ id: collection.id, unreadCount: unread })
          }
        }
      }
    },
    folderOps: {
      delete: async id => {
        const folder = await ObjectStore('feedFolder').fetchOneById(id)
        if (folder) {
          await Promise.all((folder.collections ?? []).map(async c => await instance.feedOps?.deleteCollection(c)))
          ObjectStore('feedFolder').deleteOneById(id)
        }
      },
      edit: async id => {
        const folder = await ObjectStore('feedFolder').fetchOneById(id)
        if (folder) {
          Global.dialogOps?.createOrEditFolder('feedFolder', folder)
        }
      },
      createFolder: async c => {
        return await Global.dialogOps!.createOrEditFolder('feedFolder', {
          collections: [],
          ...c
        })
      }
    }
  })
}
