import { ObjectStore } from '@/api/stores'

export default async (collectionId: number) => {
  const feedCollection = await ObjectStore('feedCollection').getOneById(collectionId)
  if (feedCollection) {
    feedCollection.items?.forEach(i => {
      ObjectStore('feed').deleteOneById(i)
    })
    ObjectStore('feedCollection').deleteOneById(collectionId)
  }
}
