// 导入文件并创建收藏夹
import { request } from '@/utils/request'
import { CollectionStore, ObjectStore } from '@/api/stores'
import { MetaObject } from '~/typings'
import { BaidudiskInstance } from '@/components/fileImporter/baidudisk/BaidudiskDisplayer'

export const handleImportAllAndCreateCollections = async (
  currentFolder = '/',
  enable?: { all?: boolean; video?: boolean; audio?: boolean; image?: boolean }
) => {
  if (localStorage.getItem('bda')) {
    const access = localStorage.getItem('bda')!
    let start = 0
    let dataArr = []
    const listall = async () => {
      const result = await fetch(
        `https://pan.baidu.com/rest/2.0/xpan/multimedia?${new URLSearchParams({
          method: 'listall',
          access_token: access,
          recursion: '1',
          path: currentFolder === '' ? '/' : currentFolder,
          start: `${start}`,
          limit: '2000',
          order: 'time'
        })}`,
        {
          method: 'get'
        }
      ).then(i => i.json())
      const data = result
      dataArr = dataArr.concat(...data.list)
      if (data.has_more) {
        start = data.cursor
        await listall()
      }
    }
    try {
      await listall()
      return dataArr
    } catch (e) {
      return dataArr
    }
  }
}

export const categorizeFilesByPath = (fileList: any[], currentFolder: string) => {
  const group = {}
  const currfol = currentFolder.split('/')
  fileList.forEach(i => {
    const realPath = i.path.replaceAll('\\', '/').replace(currentFolder, `/${currfol[currfol.length - 1]}`)
    const splited = realPath.split('/') as string[]
    let target = group
    while (splited.length) {
      const first = splited[0]
      const isLast = splited.length === 1
      if (!target[first]) {
        target[first] = isLast ? (i.isdir ? {} : i) : {}
      }
      target = target[first]
      splited.shift()
    }
  })
  return group[Object.keys(group)[0]]
}

export const normalizeGroupToCollections = async (group: any) => {
  console.log(group)
  const rootKey = Object.keys(group)[0]
  const rootCollection = await CollectionStore.addCollection({ name: rootKey, items: [], parentId: 0 })
  const loop = (o: any, parentCollectionId: number) => {
    const keys = Object.keys(o)
    keys.forEach(async key => {
      const v = o[key]
      console.log(v)
      // target is file
      if (v.isdir === 0) {
        if (v.category === 1 || (v.category === 4 && v.server_filename.endsWith('pdf'))) {
          if (v.category === 1) {
            const meta = await ObjectStore('video').addOneWithMeta(
              { videoUrl: `baidudisk${v.path}` },
              { currentMeta: { name: v.server_filename }, silent: true }
            )
            BaidudiskInstance.onCreateMeta?.(meta.meta)
            await CollectionStore.addItemToCollection({ type: 'meta', id: meta.meta.id }, parentCollectionId)
          }
          if (v.category === 4 && v.server_filename.endsWith('pdf')) {
            const meta = await ObjectStore('pdf').addOneWithMeta(
              { webFileUrl: `baidudisk/${v.fs_id}` },
              { currentMeta: { name: v.server_filename }, silent: true }
            )
            BaidudiskInstance.onCreateMeta?.(meta.meta)
            await CollectionStore.addItemToCollection({ type: 'meta', id: meta.meta.id }, parentCollectionId)
          }
        }
        return
      }
      if (typeof v === 'object') {
        const c = await CollectionStore.addCollection({ name: key, items: [], parentId: parentCollectionId }, true)
        await CollectionStore.addItemToCollection({ type: 'collection', id: c.id }, parentCollectionId)
        loop(v, c.id)
      }
    })
  }
  loop(group[rootKey], rootCollection.id)
}
