import { GlobalWebviewInstance } from '@/core/global/GlobalWebview'
import { MetaStore, ObjectStore } from '@/stores'
import Id from '@/utils/id'
import { saveImageLocally } from '@/utils/img'
import { useEffect } from 'react'
import { MetaObject } from '~/typings'
import { transformTextContentToNameAndDescription } from './utils'
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
const clearDragState = () => {
  ObjectDragState.dragFrom = undefined
  ObjectDragState.metaId = undefined
}
const useDropObject = () => {
  const dropHandler = async (e: DragEvent) => {
    const normalizedMetaObject = await normalizeDropToMeta(e)
    if (normalizedMetaObject) {
      console.log(normalizedMetaObject)
    }
  }
  const documentDropHandler = () => {
    setTimeout(() => {
      clearDragState()
    }, 10)
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
    clearDragState()
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

          const imageFilePath = (await saveImageLocally(Id.getStrId(), imageBlob, false)).data

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
    // if (e.dataTransfer?.items.length === 1) {
    //   const item = e.dataTransfer.items[0]
    //   const file = item.getAsFile()
    //   if (!file) return
    //   if (file.type.startsWith('image')) {
    //     saveImageLocally(file.name || Id.getStrId(), file, false).then(data => {
    //       ObjectStore('image').addOneWithMeta(
    //         {
    //           imageUrl: data.data
    //         },
    //         {
    //           showMetaModal: true,
    //           currentMeta: {
    //             coverImgSrc: data.data,
    //             name: file.name
    //           }
    //         }
    //       )
    //     })
    //   }
    // }
  }
  useEffect(() => {
    document.addEventListener('drop', documentDropHandler)
    return () => {
      document.removeEventListener('drop', documentDropHandler)
    }
  }, [])
  return {
    dropHandler,
    normalizeDropToMeta
  }
}

export default useDropObject
