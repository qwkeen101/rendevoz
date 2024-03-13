import { ObjectStore } from '@/api/stores'
import { assignProperties, calculateImageAspectRatio } from '@/utils'
import { atom, useAtomValue } from 'jotai'
import { IPdfInstance } from '~/typings'
import { renderPageInDarkMode } from '@/core/components/pdf/core/utils/renderer'

export const PdfInstanceAtom = atom<IPdfInstance>({})

const usePdfInstance = () => useAtomValue(PdfInstanceAtom)

export const useAssignPdfInstance = (pdfId: number) => {
  const pdf = ObjectStore('pdf').useValue(pdfId)
  const instance = usePdfInstance()

  assignProperties(instance, {
    getPdfId: () => pdfId,
    getThumbnail: async pageIdx => {
      const doc = await instance.getDocument?.()
      if (doc) {
        const canvas = document.createElement('canvas')
        const firstPage = await doc.getPage(pageIdx + 1)
        const viewport = firstPage.getViewport({ scale: 1 })
        const originalWidth = viewport.width
        const originalHeight = viewport.height
        const { width: w, height: h } = calculateImageAspectRatio(originalWidth, originalHeight, 400, 400)
        const transform = [w / originalWidth, 0, 0, h / originalHeight, 0, 0]
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        renderPageInDarkMode()
        await firstPage.render({ canvasContext: ctx, transform, viewport }).promise
        const blob = (await new Promise(res => canvas.toBlob(o => res(o)))) as Blob
        const url = URL.createObjectURL(blob)
        return url
      }
    },
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
        .deleteOneById(label)
        .then(() =>
          ObjectStore('pdf').updateOne({
            id: pdfId,
            labels: pdf?.labels?.filter(i => i !== label)
          })
        )
    }
  })
}

export default usePdfInstance
