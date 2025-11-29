import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { assignProperties } from '@/utils'
import usePDFState from '@/core/components/pdf/hooks/usePDFState'
import { decreaseLevel, increaseLevel } from '@/core/components/pdf/core/utils/zoom'

export default () => {
  const instance = usePDFInstance()
  const [pdfState, setPdfState] = usePDFState()
  assignProperties(instance, {
    actionOps: {
      ...instance.actionOps,
      doublePage: () => {
        const curr = pdfState.state?.doublePage
        instance.on?.({ type: 'doublePage', value: !curr })
      },
      zoomIn: () => {
        const currentZoom = (pdfState.scaleChanged ? pdfState.state?.scale : pdfState.viewportFitScale) ?? 1
        const nextScale = increaseLevel(currentZoom)
        setPdfState(s => ({ ...s, scaleChanged: true, state: { ...s.state, scale: nextScale } }))
        instance.on?.({ type: 'scaleChange', value: nextScale })
      },
      setScale: s => {
        setPdfState(s => ({ ...s, scaleChanged: true }))
        instance.on?.({ type: 'scaleChange', value: s })
      },
      fitWidth: () => {
        if (pdfState.viewportFitScale) {
          setPdfState(s => ({ ...s, scaleChanged: false }))
          instance.on?.({ type: 'scaleChange', value: pdfState.viewportFitScale })
        }
      },
      zoomOut: () => {
        const currentZoom = (pdfState.scaleChanged ? pdfState.state?.scale : pdfState.viewportFitScale) ?? 1
        const nextScale = Math.max(pdfState.state?.doublePage ? 0.4 : 0.2, decreaseLevel(currentZoom))
        setPdfState(s => ({ ...s, scaleChanged: true, state: { ...s.state, scale: nextScale } }))
        instance.on?.({ type: 'scaleChange', value: nextScale })
      }
    }
  })

  return null
}
