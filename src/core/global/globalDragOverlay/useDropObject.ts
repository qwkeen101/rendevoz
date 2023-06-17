import { GlobalWebviewInstance } from '@/core/global/GlobalWebview'
import { MetaStore, ObjectStore } from '@/stores'
import Id from '@/utils/id'
import { saveImageLocally } from '@/utils/img'
import { useEffect } from 'react'
import { MetaObject } from '~/typings'
import { transformTextContentToNameAndDescription } from './utils'
import { getFilenameWithoutExtension } from '@/utils/file'
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
    if (file.type.startsWith('image')) {
      return true
    }
  }
  return false
}
export const normalizeDropToMeta = async (e: DragEvent) => {
  const { dragFrom, metaId } = ObjectDragState
  const normalizedMetaObject: Partial<MetaObject> = {}
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
        const imageBlob = await (
          await fetch(imgEle.src, {
            method: 'GET',
            referrer: ''
          })
        ).blob()

        const imageFilePath = (await saveImageLocally(imageBlob, { compress: false })).data

        if (uriData) {
          // if dropped img uri not img
          if (!(await isUrlImage(uriData))) {
            const result = await GlobalWebviewInstance.getTitleAndFaviconOfUrl?.(uriData)
            if (result) {
              const { title, favicon } = result
              const webpageObject = await ObjectStore('webpage').addOne({ title, favicon, url: uriData })
              Object.assign(normalizedMetaObject, {
                coverImgSrc: imageFilePath,
                fromObject: from,
                type: 'webpage',
                objectId: webpageObject.id,
                name: webpageObject.title
              } as MetaObject)
              return normalizedMetaObject
            }
          } else {
            const imageObject = await ObjectStore('image').addOne({
              imageUrl: imageFilePath
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
        const result = await GlobalWebviewInstance.getTitleAndFaviconOfUrl?.(link)
        if (result) {
          const { favicon, title } = result
          const webpageObject = await ObjectStore('webpage').addOne({ title: webpageTitle || title, favicon, url: link })
          Object.assign(normalizedMetaObject, {
            fromObject: from,
            objectId: webpageObject.id,
            type: 'webpage',
            name: webpageObject.title
          } as MetaObject)
          return normalizedMetaObject
        }
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
  }
  if (e.dataTransfer?.items.length === 1) {
    const item = e.dataTransfer.items[0]
    const file = item.getAsFile()
    if (!file) return
    if (file.type.startsWith('image')) {
      const imageFilePath = (await saveImageLocally(file, { compress: false })).data
      const imageObject = await ObjectStore('image').addOne({ imageUrl: imageFilePath })
      Object.assign(normalizedMetaObject, {
        coverImgSrc: imageFilePath,
        fromObject: from,
        type: 'image',
        objectId: imageObject.id,
        name: getFilenameWithoutExtension(file.name) || 'Unnamed Image'
      } as MetaObject)
      return normalizedMetaObject
    }
  }
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
    const html = Array.from(e.dataTransfer?.items || []).find(i => i.type === 'text/html')
    if (html) {
      const htmlData = e.dataTransfer?.getData('text/html')
      const uriData = e.dataTransfer?.getData('text/uri-list')
      const textData = e.dataTransfer?.getData('text/plain')
      console.log({
        html: htmlData,
        uri: uriData,
        text: textData
      })
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

          const imageFilePath = (await saveImageLocally(imageBlob, { compress: false })).data

          if (uriData) {
            // if dropped img uri not img
            if (!(await isUrlImage(uriData))) {
              const result = await GlobalWebviewInstance.getTitleAndFaviconOfUrl?.(uriData)
              if (result) {
                const { title, favicon } = result
                const webpageObject = await ObjectStore('webpage').addOne({ title, favicon, url: uriData })
                Object.assign(normalizedMetaObject, {
                  coverImgSrc: imageFilePath,
                  fromObject: from,
                  type: 'webpage',
                  objectId: webpageObject.id,
                  name: webpageObject.title
                } as MetaObject)
                return normalizedMetaObject
              }
            } else {
              const imageObject = await ObjectStore('image').addOne({
                imageUrl: imageFilePath
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
          const result = await GlobalWebviewInstance.getTitleAndFaviconOfUrl?.(link)
          if (result) {
            const { favicon, title } = result
            const webpageObject = await ObjectStore('webpage').addOne({ title: webpageTitle || title, favicon, url: link })
            Object.assign(normalizedMetaObject, {
              fromObject: from,
              objectId: webpageObject.id,
              type: 'webpage',
              name: webpageObject.title
            } as MetaObject)
            return normalizedMetaObject
          }
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
    }
    if (e.dataTransfer?.items.length === 1) {
      const item = e.dataTransfer.items[0]
      const file = item.getAsFile()
      if (!file) return
      if (file.type.startsWith('image')) {
        const imageFilePath = (await saveImageLocally(file, { compress: false })).data
        const imageObject = await ObjectStore('image').addOne({ imageUrl: imageFilePath })
        Object.assign(normalizedMetaObject, {
          coverImgSrc: imageFilePath,
          fromObject: from,
          type: 'image',
          objectId: imageObject.id,
          name: getFilenameWithoutExtension(file.name) || 'Unnamed Image'
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
