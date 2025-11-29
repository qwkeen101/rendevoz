import { MetaStore, ObjectStore } from '@/api/stores'
import FileSystem from '@/api/fileSystem'
import { MetaObject } from '~/typings'

export default async (id: number, meta?: MetaObject) => {
  if (meta) {
    return await MetaStore.updateMetaObject({ id: meta.id, temp: false, deleted: false })
  }
  const episode = await ObjectStore('episode').getOneById(id)
  if (episode) {
    const audio = await ObjectStore('audio').addOne({
      thumbnail: episode.thumbnail,
      episodeId: episode.id,
      url: episode.enclosureURL
    })
    if (audio) {
      const meta = await MetaStore.addMetaObject({
        type: 'audio',
        name: episode.name,
        objectId: audio.id,
        description: episode.description
      })
      MetaStore.triggerObjectIndex()
      await ObjectStore('episode').updateOne({ id, audioMetaId: meta.id })
      if (episode.thumbnail) {
        FileSystem.saveImage(episode.thumbnail).then(res => {
          ObjectStore('audio').updateOne({ id: audio.id, thumbnail: res })
          MetaStore.updateMetaObject({ id: meta.id, coverImgSrc: res })
        })
      }
      return meta
    }
  }
}
