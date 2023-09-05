import { transformTextContentToNameAndDescription } from '@/core/global/globalDragOverlay/utils'
import { ObjectStore } from '@/stores'
import { assignProperties } from '@/utils'
import { atom, useAtomValue } from 'jotai'
import { IPdfInstance } from '~/typings'
import { getSetting } from '@/core'
import { truncate } from 'lodash'
import { truncateString } from '@/utils/text'

export const PdfInstanceAtom = atom<IPdfInstance>({})

const usePdfInstance = () => useAtomValue(PdfInstanceAtom)

export const useAssignPdfInstance = (pdfId: number) => {
  const pdf = ObjectStore('pdf').useValue(pdfId)
  const instance = usePdfInstance()
  assignProperties(instance, {
    getPdfId: () => pdfId,
    insertLabel: async label => {
      const setting = getSetting()
      let name = 'Unnamed PDF Label'
      if (setting.label.showOriginalText && label.type === 'highlight' && label.selectedText) {
        name = truncateString(label.selectedText)
      } else if (label.type === 'highlight' && label.selectedText) {
        name = label.selectedText
      }
      const truncatedName = name
      await ObjectStore('pdfLabel')
        .addOne({
          name: truncatedName,
          documentId: pdfId,
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
