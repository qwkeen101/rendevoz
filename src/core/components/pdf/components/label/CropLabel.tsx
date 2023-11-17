import { MetaStore, ObjectStore } from '@/api/stores'
import { IPdfLabel, PageSize } from '~/typings'
import { ResizeAndDrag } from '@/components'
import { deleteLocalFile } from '@/utils'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
import { useSetAtom } from 'jotai'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import { useEffect, useRef } from 'react'
import usePdfSelectMode from '@/core/components/pdf/hooks/useSelectMode'
import { useSelectAtomValue } from '@/hooks'
import { Colors } from '@/consts'
import LabelNoteRenderer from '@/core/components/pdf/components/label/LabelNoteRenderer'

const CropLabel = ({ labelId, pageSize }: { labelId: number; pageSize: PageSize }) => {
  const label = ObjectStore('pdfLabel').useValue(labelId) as (IPdfLabel & { type: 'crop' }) | undefined
  const instance = usePdfInstance()
  const labelMeta = MetaStore.useObjectToMetaValue(labelId)
  const setPdfState = useSetAtom(PdfStateAtom)
  const dragInitPos = useRef({ x: 0, y: 0 })
  const [selectMode] = usePdfSelectMode()
  const currentHighlightLabelId = useSelectAtomValue(PdfStateAtom, s => s.currentHighlightLabelId)
  useEffect(() => {
    if (currentHighlightLabelId === labelId) {
      setTimeout(() => {
        setPdfState(s => ({ ...s, currentHighlightLabelId: undefined }))
      }, 1500)
    }
  }, [currentHighlightLabelId])
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
        MetaStore.updateMetaObject({ id: labelMeta.id, coverImgSrc: newImage }, true)
      }
    })
  }
  if (label) {
    return (
      <ResizeAndDrag
        size={{ width: pageSize.width * label.rect.width, height: pageSize.height * label.rect.height }}
        position={{
          x: pageSize.width * label.rect.left,
          y: pageSize.height * label.rect.top
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
          borderRadius: 6,
          boxShadow: `0 0 0 2px ${label.color}`,
          background: currentHighlightLabelId === labelId ? Colors.Common.SelectColorTransparent : undefined
        }}
      >
        <LabelNoteRenderer labelId={labelId} />
      </ResizeAndDrag>
    )
  }

  return null
}
export default CropLabel
