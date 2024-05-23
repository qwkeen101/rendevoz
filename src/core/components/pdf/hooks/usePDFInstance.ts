import { ObjectStore } from '@/api/stores'
import { assignProperties, calculateImageAspectRatio, waitFor } from '@/utils'
import { atom, useAtomValue, useStore } from 'jotai'
import { IPDFInstance } from '~/typings'
import { renderPageInDarkMode } from '@/core/components/pdf/core/utils/renderer'
import search from './ops/search'
import captureImage from './ops/captureImage'
import produce from 'immer'

export const PdfInstanceAtom = atom<IPDFInstance>({})

const usePDFInstance = () => useAtomValue(PdfInstanceAtom)

export const useAssignPdfInstance = (pdfId: number) => {
  const pdf = ObjectStore('pdf').useValue(pdfId)
  const instance = usePDFInstance()
  const store = useStore()
  assignProperties(instance, {
    getPdfId: () => pdfId,
    getDocument: async () => {
      return await new Promise((res, rej) => {
        if (instance.values.document) {
          res(instance.values.document)
        } else {
          waitFor(
            () => !!instance.values.document,
            () => {
              res(instance.values.document!)
            },
            {
              onTimeout: () => {
                rej()
              }
            }
          )
        }
      })
    },
    getThumbnail: async (pageIdx, size) => {
      await new Promise(res =>
        waitFor(
          () => !!instance.values.thumbnailDocument,
          () => res(null)
        )
      )
      if (store.get(instance.values.thumbnailAtom).has(pageIdx)) {
        return store.get(instance.values.thumbnailAtom).get(pageIdx)
      }
      const doc = instance.values.thumbnailDocument
      if (doc) {
        renderPageInDarkMode()
        const desiredWidth = size?.width ?? 300
        const canvas = document.createElement('canvas')
        const firstPage = await doc.getPage(pageIdx + 1)
        const viewport = firstPage.getViewport({ scale: 1 })
        const scaled = desiredWidth / viewport.width
        const scaledViewport = firstPage.getViewport({ scale: scaled })
        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height
        const ctx = canvas.getContext('2d')!
        // renderPageInDarkMode()
        await firstPage.render({ canvasContext: ctx, viewport: scaledViewport }).promise
        const blob = (await new Promise(res => canvas.toBlob(o => res(o)))) as Blob
        canvas.remove()
        const url = URL.createObjectURL(blob)
        firstPage.cleanup()
        store.set(
          instance.values.thumbnailAtom,
          produce(store.get(instance.values.thumbnailAtom), d => {
            d.set(pageIdx, url)
          })
        )
        return url
      }
    },
    search: query => search(query, instance),
    capturePageImage: async (p, box) => await captureImage(p, instance, box),
    insertLabel: async label => {
      await ObjectStore('pdfLabel')
        .addOne({
          parentObjectId: pdfId,
          ...label
        })
        .then(one =>
          ObjectStore('pdf').updateOne({
            id: pdfId,
            labels: [...(pdf?.labels || []), one.id]
          })
        )
    },
    deleteLabel: async label => {
      await ObjectStore('pdfLabel')
        .deleteOneById(label, { force: true })
        .then(() =>
          ObjectStore('pdf').updateOne({
            id: pdfId,
            labels: pdf?.labels?.filter(i => i !== label)
          })
        )
    },
    getOutline: async () => {
      const doc = await instance.getDocument?.()
      if (doc) {
        return await doc.getOutline()
      }
    }
  })
}

export default usePDFInstance
