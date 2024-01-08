import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
import { assignProperties } from '@/utils'
import usePdfState from '@/core/components/pdf/hooks/usePdfState'
import { IPdfDocument } from '~/typings'
import { ObjectStore } from '@/api/stores'
import { decreaseLevel, increaseLevel } from '@/core/components/pdf/core/utils/zoom'

export default () => {
  const instance = usePdfInstance()
  const [pdfState, setPdfState] = usePdfState()
  const updatePdf = async (p: Partial<IPdfDocument>) => {
    const id = pdfState.pdfId
    if (id) {
      await ObjectStore('pdf').updateOne({ id, ...p })
    }
  }
  assignProperties(instance, {
    actionOps: {
      zoomIn: () => {
        const currentZoom = pdfState.document?.scale ?? 1
        const nextScale = increaseLevel(currentZoom)
        updatePdf({ scale: nextScale })
      },
      setScale: s => {
        updatePdf({ scale: s })
      },
      fitWidth: () => {
        updatePdf({ scale: pdfState.viewportFitScale })
      },
      zoomOut: () => {
        const currentZoom = pdfState.document?.scale ?? 1
        const nextScale = decreaseLevel(currentZoom)
        updatePdf({ scale: nextScale })
      }
    }
  })

  return null
}
