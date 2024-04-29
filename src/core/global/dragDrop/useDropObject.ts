import { MetaStore, ObjectStore } from '@/api/stores'
import { useEffect } from 'react'
import { MetaObject } from '~/typings'
import { transformTextContentToNameAndDescription } from './utils'
import FileSystem from '@/api/fileSystem'
import { Rendevoz } from '@/core/rendevoz'
import toast from 'react-hot-toast'

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
    const html = e.dataTransfer?.getData('text/html')

    if (html) {
      const htmlData = e.dataTransfer?.getData('text/html')

      const uriData = e.dataTransfer?.getData('text/uri-list')
      const textData = e.dataTransfer?.getData('text/plain').startsWith('http') ? undefined : e.dataTransfer?.getData('text/plain')
      let plainLinkData = e.dataTransfer?.getData('text/plain').startsWith('http') ? e.dataTransfer?.getData('text/plain') : undefined
      if (htmlData) {
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlData, 'text/html')
        const imgEle = doc.querySelector('img')
        const linkEle = doc.querySelector('a')
        if (imgEle && imgEle.src) {
          const imageFilePath = await FileSystem.saveImage(imgEle.src, {
            compress: false
          })
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
        if (linkEle && linkEle.href && uriData) {
          const link = linkEle.href
          const webpageObject = await ObjectStore('webpage').addOne({
            url: link
          })
          Object.assign(normalizedMetaObject, {
            fromObject: from,
            type: 'webpage',
            objectId: webpageObject.id,
            name: linkEle.textContent
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
          url: link
        })
        Object.assign(normalizedMetaObject, {
          fromObject: from,
          type: 'webpage',
          objectId: webpageObject.id,
          name: webpageTitle
        } as MetaObject)
        return normalizedMetaObject
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
