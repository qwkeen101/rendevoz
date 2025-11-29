import { MetaStore, ObjectStore } from '@/api/stores'
import { IPDFLabel } from '~/typings'
import { ResizeAndDrag } from '@/components'
import { deleteLocalFile } from '@/utils'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { useSetAtom } from 'jotai'
import { PDFStateAtom } from '@/core/components/pdf/hooks/usePDFState'
import { useRef } from 'react'
import { useSelectAtomValue } from '@/hooks'
import { Colors } from '@/consts'

const CropLabel = ({
  labelId,
  transformScale,
  width,
  height
}: {
  labelId: number
  width: number
  height: number
  transformScale?: number
}) => {
  const label = ObjectStore('pdfLabel').useValue(labelId) as (IPDFLabel & { type: 'crop' }) | undefined
  const instance = usePDFInstance()
  const labelMeta = MetaStore.useObjectToMetaValue(labelId)
  const setPdfState = useSetAtom(PDFStateAtom)
  const dragInitPos = useRef({ x: 0, y: 0 })
  const selectMode = useSelectAtomValue(PDFStateAtom, s => s.selectMode)
  const currentHighlightLabelId = useSelectAtomValue(PDFStateAtom, s => s.currentHighlightLabelId)
  const handleResizeOrDrag = async (element: HTMLElement) => {
    if (!label || label.page === undefined) return
    const originalImage = label?.imageUrl
    if (originalImage) {
      deleteLocalFile(originalImage)
    }
    const bounding = element.getBoundingClientRect()
    const parentBounding = element.parentElement!.getBoundingClientRect()
    const rect = {
      left: Number(((bounding.left - parentBounding.left) / parentBounding.width).toFixed(3)),
      top: Number(((bounding.top - parentBounding.top) / parentBounding.height).toFixed(3)),
      width: Number((bounding.width / parentBounding.width).toFixed(3)),
      height: Number((bounding.height / parentBounding.height).toFixed(3))
    }

    await ObjectStore('pdfLabel').updateOne({ id: labelId, rect })
    const newImage = await instance.capturePageImage?.(label.page, rect)
    setTimeout(() => {
      ObjectStore('pdfLabel').updateOne({ id: labelId, imageUrl: newImage })
      if (labelMeta) {
        MetaStore.updateMetaObject({ id: labelMeta.id, coverImgSrc: newImage })
      }
    })
  }
  if (labelMeta?.deleted) return null
  if (label) {
    const defaultColor = 'rgba(39, 158, 255)'
    return (
      <ResizeAndDrag
        size={{ width: width * label.rect.width, height: height * label.rect.height }}
        position={{
          x: width * label.rect.left,
          y: height * label.rect.top
        }}
        bounds={'parent'}
        onResizeStop={(e, dir, element) => {
          handleResizeOrDrag(element)
        }}
        onDragStart={(e, data) => {
          dragInitPos.current = {
            x: data.x,
            y: data.y
          }
        }}
        scale={transformScale}
        onDragStop={(e, data) => {
          const { x, y } = data
          if (Math.abs(x - dragInitPos.current.x) > 5 || Math.abs(y - dragInitPos.current.y) > 5) {
            handleResizeOrDrag(data.node)
          } else {
            if (e.target !== data.node) return
            setTimeout(() => {
              setPdfState(s => ({
                ...s,
                currentFocusedLabel: {
                  labelId,
                  position: {
                    x: e.clientX,
                    y: e.clientY
                  }
                }
              }))
            })
          }
        }}
        style={{
          pointerEvents: selectMode ? 'none' : 'auto',
          borderRadius: 4,
          boxShadow: `0 0 0 1px ${label.color === defaultColor ? defaultColor : Colors.getAdaptColor(label.color)}`,
          background:
            label.color === defaultColor
              ? Colors.getAlphaColor(defaultColor.replace('rgba', 'rgb'), currentHighlightLabelId === labelId ? 0.3 : 0.1)
              : Colors.getAlphaColor(Colors.getAdaptColor(label.color), currentHighlightLabelId === labelId ? 0.4 : 0.15)
        }}
        cancel={'.cancel'}
      >
      </ResizeAndDrag>
    )
  }

  return null
}
export default CropLabel
