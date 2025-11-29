// 导入文件并创建收藏夹
import { CollectionStore, ObjectStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { BaiduFile, ICollectionItem, MetaObject } from '~/typings'
import fileSystem from '@/api/fileSystem'

const importFile = async (file: BaiduFile) => {
  let image = file.thumbs?.url3 || file.thumbs?.url2 || file.thumbs?.url1
  if (image) {
    try {
      image = await fileSystem.saveImage(await fetch(image).then(i => i.blob()))
    } catch (e) {
      image = ''
    }
  }
  if (file.category === 1) {
    const meta = await ObjectStore('video').addOneWithMeta(
      { url: `baidudisk${file.path}` },
      { currentMeta: { name: file.server_filename || file.filename, coverImgSrc: image }, silent: true }
    )
    return meta.meta
  } else {
    const meta = await ObjectStore('cloudFile').addOneWithMeta(
      { url: `baidudisk${file.path}` },
      { currentMeta: { name: file.server_filename || file.filename, coverImgSrc: image }, silent: true }
    )
    return meta.meta
  }
}
const importFolder = async (
  currentFolder = '/',
  opts?: {
    onCreate?: (m: MetaObject) => void
    parentCollectionId?: number
    onProgress?: (opts: { name: string; progress: number; id: number; collectionId?: number }) => void
  }
) => {
  if (KeyvalueStore.getOne('baiduAccessToken')) {
    const access = KeyvalueStore.getOne('baiduAccessToken')!
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
          order: 'name',
          web: '1'
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

    await listall()
    const categorized = categorizeFilesByPath(dataArr, currentFolder)
    normalizeGroupToCollections(categorized, opts)
  }
}

const categorizeFilesByPath = (fileList: any[], currentFolder: string) => {
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

const normalizeGroupToCollections = async (
  group: any,
  opts?: {
    onCreate?: (m: MetaObject) => void
    parentCollectionId?: number
    onProgress?: (opts: { name: string; progress: number; id: number; collectionId?: number }) => void
  }
) => {
  const { parentCollectionId, onCreate, onProgress } = opts || {}
  const rootKey = Object.keys(group)[0]
  const rootCollection = await CollectionStore.addCollection({ name: rootKey, items: [], parentId: parentCollectionId ?? 0 })
  if (parentCollectionId) {
    await CollectionStore.addItemToCollection({ type: 'collection', id: rootCollection.id }, parentCollectionId)
  }
  onProgress?.({
    progress: 0,
    name: rootKey,
    id: rootCollection.id,
    collectionId: rootCollection.id
  })
  const loop = async (o: any, parentCollectionId: number) => {
    const keys = Object.keys(o)
    const items: ICollectionItem[] = []
    await Promise.allSettled(
      keys.map(async key => {
        const v = o[key]
        // target is file
        if (v.isdir === 0) {
          const meta = await importFile(v)
          onCreate?.(meta)
          items.push({ type: 'meta', id: meta.id })
          return
        }
        // target is sub folders
        if (typeof v === 'object') {
          const c = await CollectionStore.addCollection({ name: key, items: [], parentId: parentCollectionId })
          items.push({ type: 'collection', id: c.id })
          await loop(v, c.id)
        }
      })
    )
    if (items.length) {
      await CollectionStore.addItemToCollection(items, parentCollectionId)
    }
  }
  await loop(group[rootKey], rootCollection.id)
  onProgress?.({
    progress: 1,
    name: rootKey,
    id: rootCollection.id,
    collectionId: rootCollection.id
  })
}

export default async (
  file: BaiduFile | string | BaiduFile[] | string[] | (string | BaiduFile)[],
  opts?: {
    parentCollectionId?: number
    onImport?: (m: MetaObject, isNested?: boolean) => void
    onFolderProgress?: (opts: { name: string; progress: number; id: number; collectionId?: number }) => void
  }
) => {
  const items = Array.isArray(file) ? file : [file]
  const metaItems: ICollectionItem[] = []
  await Promise.allSettled(
    items.map(async i => {
      if (typeof i === 'string' || i.isdir) {
        const path = typeof i === 'string' ? i : i.path
        return await importFolder(path, { ...opts, onCreate: opts?.onImport, onProgress: opts?.onFolderProgress })
      }
      const m = await importFile(i)
      opts?.onImport?.(m, false)
      metaItems.push({ type: 'meta', id: m.id })
    })
  )
  if (metaItems.length) {
    if (opts?.parentCollectionId) {
      CollectionStore.addItemToCollection(metaItems, opts.parentCollectionId)
    }
  }
}
