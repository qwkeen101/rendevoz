import { transformTextContentToNameAndDescription } from '@/core/global/globalDragOverlay/utils'
import { ObjectStore } from '@/stores'
import { assignProperties } from '@/utils'
import { atom, useAtomValue } from 'jotai'
import { IPdfInstance } from '~/typings'

export const PdfInstanceAtom = atom<IPdfInstance>({})

const usePdfInstance = () => useAtomValue(PdfInstanceAtom)

export const useAssignPdfInstance = (pdfId: number) => {
  const pdf = ObjectStore('pdf').useValue(pdfId)
  const instance = usePdfInstance()

  assignProperties(instance, {
    getPdfId: () => pdfId,
    insertLabel: async label => {
      const result = label.type === 'highlight' && label.selectedText && transformTextContentToNameAndDescription(label.selectedText)
      const truncatedName = result ? result.name : 'Unnamed Label'
      const description = result ? result.description : undefined
      await ObjectStore('pdfLabel')
        .addOne({
          name: truncatedName,
          description,
          documentId: pdfId,
          ...label
        })
        .then(one => ObjectStore('pdf').updateOne({ id: pdfId, labels: [...(pdf?.labels || []), one.id] }))
    },
    deleteLabel: async label => {
      await ObjectStore('pdfLabel')
        .deleteOneById(label)
        .then(() => ObjectStore('pdf').updateOne({ id: pdfId, labels: pdf?.labels?.filter(i => i !== label) }))
    }
  })
}

export default usePdfInstance
