import { ObjectFamily } from '@/api/stores/object/object.store'
import FileSystem from '@/api/fileSystem'
import { MetaStore, ObjectStore } from '@/api/stores'
import useDb from '../../../hooks/stores/useDb'
import { deleteRendefile } from '@/utils'
import { INote, MetaGroup } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export default async (o: ObjectFamily[keyof ObjectFamily], force: boolean) => {
  if ('specType' in o) {
    if ('imageUrl' in o && o.imageUrl) {
      FileSystem.deleteFile(o.imageUrl)
    }
    if ('fileUrl' in o && o.fileUrl) {
      FileSystem.deleteFile(o.fileUrl)
    }
    if ('url' in o && o.url) {
      FileSystem.deleteFile(o.url)
    }
    if ('excalidrawUrl' in o && o.excalidrawUrl) {
      FileSystem.deleteFile(o.excalidrawUrl)
    }
    if ('labels' in o && o.labels) {
      const labelType = `${o.specType}Label`
      const store = ObjectStore(labelType)
      o.labels.forEach(id => {
        store.deleteOneById(id, { force: force })
      })
    }
    const handleRemoveNote = async (note: INote) => {
      console.log(note)
      const contentId = note.contentId
      const blobDb = useDb('blobs')
      const url = await blobDb.get(contentId)
      await blobDb.delete(contentId)
      if (typeof url?.fileUrl === 'string') {
        FileSystem.deleteFile(url.fileUrl)
      }
    }
    switch (o.specType) {
      case 'note': {
        handleRemoveNote(o)
        break
      }
      case 'webpage': {
        o.noteId && ObjectStore('note').deleteOneById(o.noteId)
        break
      }
      case 'tag': {
        const currWorkspace = KeyvalueStore.getOne('currentWorkspace')
        currWorkspace && KeyvalueStore.deleteOne(`tag_${o.id}_${currWorkspace.id}_group`)
        break
      }
      case 'metaProp': {
        KeyvalueStore.deleteOne(`prop_${o.id}_group`)
        break
      }
      case 'group': {
        {
          const g = o as MetaGroup
          const metaMap = MetaStore.getMetaObjectsMap()
          const allMetaIds = Array.from(new Set(g.values.map(i => i.id)).values())
          const allHiddenMetas = allMetaIds.map(i => metaMap.get(i)).filter(i => i?.hidden)
          allHiddenMetas.forEach(m => m && MetaStore.updateMetaObject({ id: m.id, hidden: false }))
          break
        }
      }
    }
  }
}
