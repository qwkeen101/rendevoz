import { MetaStore, ObjectStore } from '@/api/stores'
import { useEffect } from 'react'
import { MetaObject } from '~/typings'
import { transformTextContentToNameAndDescription } from './utils'
import { getFilenameWithoutExtension } from '@/utils/file'
import { Regexp } from '@/utils'
import FileSystem from '@/api/fileSystem'
import { Rendevoz } from '@/core/rendevoz'
import toast from 'react-hot-toast'

function isUrlImage(url: string) {
  return fetch(url, { method: 'HEAD' }).then(res => {
    return res.headers.get('Content-Type')?.startsWith('image')
  })
}

export const ObjectDragState: {
  dragFrom?: 'webpage'
} & {
  metaId?: number
} = {}
export const clearDragState = () => {
  ObjectDragState.dragFrom = undefined
  ObjectDragState.metaId = undefined
}
export const checkDropCanBeMeta = (e: DragEvent) => {
  const { dragFrom, metaId } = ObjectDragState
  const from: MetaObject['fromObject'] | undefined =
    dragFrom && metaId
      ? {
          type: dragFrom,
          metaId: metaId
        }
      : undefined
  const html = Array.from(e.dataTransfer?.items || []).find(i => i.type === 'text/html')
  if (html) {
    const htmlData = e.dataTransfer?.getData('text/html')
    const uriData = e.dataTransfer?.getData('text/uri-list')
    const textData = e.dataTransfer?.getData('text/plain')
    if (htmlData) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlData, 'text/html')
      const imgEle = doc.querySelector('img')
      const linkEle = doc.querySelector('a')
      if (imgEle && imgEle.src) {
        if (uriData) {
          return true
        }
      }
      if (linkEle && linkEle.href && uriData) {
        return true
      }

      if (textData) {
        if (!from) return false
        return true
      }
    }
  }
  if (e.dataTransfer?.items.length === 1) {
    const item = e.dataTransfer.items[0]
    const file = item.getAsFile()
    if (!file) return false
  }
  return false
}

export const fetchHead = async (url: string) => {
  const res = await fetch(url)
  const text = await res.text()
  const parser = new DOMParser()
  const dom = parser.parseFromString(text, 'text/html')
  const head = dom.head
  const title = head.querySelector('title')?.textContent
  const metas = Array.from(head.querySelectorAll('meta').values())
  const descriptionMeta = metas.find(i => i.name === 'description' || i.getAttribute('property') === 'og:description')?.content
  const imageMeta = metas.find(i => i.getAttribute('property') === 'og:image')?.content
  const coverImgSrc = imageMeta && (await FileSystem.fetchRemoteImageAndSaveLocally(imageMeta))
  return {
    title,
    description: descriptionMeta,
    coverImgSrc
  }
}
export const fetchHeadAndUpdateWebpage = async (url: string, webpageId: number) => {
  const res = await fetch(url)
  const text = await res.text()
  const parser = new DOMParser()
  const dom = parser.parseFromString(text, 'text/html')
  const head = dom.head
  const title = head.querySelector('title')?.textContent
  const icon = Array.from(head.querySelectorAll('link').values())
    .find(i => i.rel.includes('icon'))
    ?.href.replace('http://localhost:7777', '')
  const urlRoot = new URL(url).host
  const realIcon = icon ? (Regexp.isValidWebUrl(icon) ? icon : `https://${urlRoot}${icon}`) : undefined
  const metas = Array.from(head.querySelectorAll('meta').values())
  const descriptionMeta = metas.find(i => i.name === 'description' || i.getAttribute('property') === 'og:description')?.content
  const imageMeta = metas.find(i => i.getAttribute('property') === 'og:image')?.content
  const coverImgSrc = imageMeta && (await FileSystem.fetchRemoteImageAndSaveLocally(imageMeta))
  const iconSrc = realIcon && (await FileSystem.fetchRemoteImageAndSaveLocally(realIcon))
  ObjectStore('webpage').updateOne({ id: webpageId, favicon: iconSrc, title })
  setTimeout(() => {
    const webpageMeta = MetaStore.getMetaObjectByObjectId(webpageId)
    if (webpageMeta) {
      MetaStore.updateMetaObject(
        {
          id: webpageMeta.id,
          description: webpageMeta.description || descriptionMeta,
          coverImgSrc: webpageMeta.coverImgSrc || coverImgSrc,
          name: title || webpageMeta.name
        },
        true
      )
    }
  }, 1000)
}
const useDropObject = () => {
  const documentDropHandler = () => {
    setTimeout(() => {
      clearDragState()
    }, 100)
  }
  const normalizeDropToMeta = async (e: DragEvent) => {
    const { dragFrom, metaId } = ObjectDragState
    const normalizedMetaObject: Partial<MetaObject> = {}
    const from: MetaObject['fromObject'] | undefined =
      dragFrom && metaId
        ? {
            type: dragFrom,
            metaId: metaId
          }
        : undefined
    const allStrings = (await Promise.all(
      Array.from(e.dataTransfer?.items || []).map(i => new Promise(res => i.getAsString(s => res(s))))
    )) as string[]
    const html = Array.from(e.dataTransfer?.items || []).find(i => i.type === 'text/html') || allStrings.some(i => i.startsWith('http'))
    if (html) {
      const htmlData = e.dataTransfer?.getData('text/html')
      const uriData = e.dataTransfer?.getData('text/uri-list')
      const textData = e.dataTransfer?.getData('text/plain').startsWith('http') ? undefined : e.dataTransfer?.getData('text/plain')
      let plainLinkData = e.dataTransfer?.getData('text/plain').startsWith('http') ? e.dataTransfer?.getData('text/plain') : undefined
      if (allStrings.some(i => i.startsWith('http'))) {
        plainLinkData = allStrings.find(i => i.startsWith('http'))
      }
      if (htmlData) {
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlData, 'text/html')
        const imgEle = doc.querySelector('img')
        const linkEle = doc.querySelector('a')
        if (imgEle && imgEle.src) {
          const imageBlob = await (
            await fetch(imgEle.src, {
              method: 'GET',
              referrer: ''
            })
          ).blob()

          const imageFilePath = await FileSystem.saveImage(imageBlob, {
            compress: false
          })

          if (uriData) {
            // if dropped img uri not img
            if (!(await isUrlImage(uriData))) {
              const webpageObject = await ObjectStore('webpage').addOne({
                title: uriData,
                url: uriData
              })
              fetchHeadAndUpdateWebpage(uriData, webpageObject.id)
              Object.assign(normalizedMetaObject, {
                coverImgSrc: imageFilePath,
                fromObject: from,
                type: 'webpage',
                objectId: webpageObject.id,
                name: webpageObject.title
              } as MetaObject)
              return normalizedMetaObject
            } else {
              const imageObject = await ObjectStore('image').addOne({
                url: imageFilePath
              })
              const imageName = imgEle.alt || uriData || 'Unnamed Image'
              Object.assign(normalizedMetaObject, {
                coverImgSrc: imageFilePath,
                fromObject: from,
                type: 'image',
                objectId: imageObject.id,
                name: imageName
              } as MetaObject)
              return normalizedMetaObject
            }
          }
        }
        if (linkEle && linkEle.href && uriData) {
          const link = linkEle.href
          const webpageTitle = linkEle.textContent
          const webpageObject = await ObjectStore('webpage').addOne({
            title: webpageTitle || link,
            url: link
          })
          fetchHeadAndUpdateWebpage(link, webpageObject.id)
          Object.assign(normalizedMetaObject, {
            fromObject: from,
            type: 'webpage',
            objectId: webpageObject.id,
            name: webpageObject.title
          } as MetaObject)
          return normalizedMetaObject
        }

        if (textData) {
          if (!from) return
          const webpageMeta = await MetaStore.getMetaObjectById(from.metaId)
          if (!webpageMeta?.objectId) return
          const webpageLabelObject = await ObjectStore('webpageLabel').addOne({
            selectedText: textData,
            webpageId: webpageMeta.objectId
          })
          if (from) {
            from.selectedText = textData
          }
          const { name, description } = transformTextContentToNameAndDescription(textData)
          Object.assign(normalizedMetaObject, {
            type: 'webpageLabel',
            objectId: webpageLabelObject.id,
            fromObject: from,
            name,
            description
          } as MetaObject)
          return normalizedMetaObject
        }
      }
      if (plainLinkData) {
        const link = plainLinkData
        const webpageTitle = plainLinkData
        const webpageObject = await ObjectStore('webpage').addOne({
          title: webpageTitle || link,
          url: link
        })
        fetchHeadAndUpdateWebpage(link, webpageObject.id)
        Object.assign(normalizedMetaObject, {
          fromObject: from,
          type: 'webpage',
          objectId: webpageObject.id,
          name: webpageObject.title
        } as MetaObject)
        return normalizedMetaObject
      }
    }
    if (e.dataTransfer?.items.length === 1) {
      const item = e.dataTransfer.items[0]
      const file = item.getAsFile()
      if (!file) return
      try {
        const meta = await Rendevoz.Utils.Meta.normalizeLocalFileToMeta(file)
        const obj = await ObjectStore(meta.type).addOne({ ...meta.object })
        Object.assign(normalizedMetaObject, {
          fromObject: from,
          objectId: obj.id,
          ...meta.meta
        } as MetaObject)
        return normalizedMetaObject
      } catch (e) {
        toast.error(Rendevoz.Consts.Errors.NotSupportedFile())
        console.error(e)
      }
    }
  }
  useEffect(() => {
    document.addEventListener('drop', documentDropHandler)
    return () => {
      document.removeEventListener('drop', documentDropHandler)
    }
  }, [])
  return {
    normalizeDropToMeta
  }
}

export default useDropObject
