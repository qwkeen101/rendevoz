import { MetaStore, ObjectStore } from '@/api/stores'
import FileSystem from '@/api/fileSystem'

export default async (id: number) => {
  const episode = await ObjectStore('episode').getOneById(id)
  if (episode) {
    const image = episode.thumbnail && (await FileSystem.saveImage(episode.thumbnail))
    const audio = await ObjectStore('audio').addOne({
      thumbnail: image,
      episodeId: episode.id,
      url: episode.enclosureURL
    })
    if (audio) {
      const meta = await MetaStore.addMetaObject({
        type: 'audio',
        name: episode.name,
        coverImgSrc: image,
        objectId: audio.id,
        description: episode.description
      })
      await ObjectStore('episode').updateOne({ id, audioMetaId: meta.id })
      return meta
    }
  }
}
