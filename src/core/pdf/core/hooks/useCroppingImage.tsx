import { useMemoizedFn, useRafFn, useSelectAtomValue } from '@/hooks'
import { PdfStateAtom } from '@/core/pdf/hooks/usePdfState'
import { RefObject, useEffect, useState } from 'react'
import { Colors } from '@/consts'
import { Box } from '~/typings'
import { useSetAtom } from 'jotai'

const useCroppingImage = (containerRef: RefObject<HTMLElement>, onImageCropped: (box: Box) => void) => {
  const isCroppingImage = useSelectAtomValue(PdfStateAtom, s => s.croppingImage)
  const [selectBoxState, setSelectBoxState] = useState<{
    start: {
      px: number
      py: number
    }
    end: {
      px: number
      py: number
    }
  }>()
  const setPdfState = useSetAtom(PdfStateAtom)
  const getRelativePoint = (e: PointerEvent, bounding: DOMRect) => {
    const { clientX, clientY } = e
    const { left, top, width, height } = bounding
    const rel = {
      px: Math.max((clientX - left) / width, 0),
      py: Math.max((clientY - top) / height, 0)
    }
    return rel
  }
  const rafPointermove = useRafFn((e: PointerEvent, container: HTMLElement) => {
    const containerBounding = container.getBoundingClientRect()
    setSelectBoxState(s => ({ ...s, end: getRelativePoint(e, containerBounding) }))
  })
  const _pointerUpHandler = useMemoizedFn(() => {
    if (selectBoxState) {
      const { start, end } = selectBoxState
      const left = Math.min(start.px, end.px)
      const top = Math.min(start.py, end.py)
      const width = Math.abs(start.px - end.px)
      const height = Math.abs(start.py - end.py)
      onImageCropped({ left, top, width, height })
    }
  })
  useEffect(() => {
    if (isCroppingImage) {
      const container = containerRef.current
      if (container) {
        const pointerDownHandler = (e: PointerEvent) => {
          const containerBounding = container.getBoundingClientRect()
          document.addEventListener('pointerup', pointerUpHandler)
          container.addEventListener('pointermove', pointerMoveHandler)
          setSelectBoxState({
            start: getRelativePoint(e, containerBounding),
            end: getRelativePoint(e, containerBounding)
          })
        }
        const pointerMoveHandler = (e: PointerEvent) => {
          e.preventDefault()
          rafPointermove(e, container)
        }
        const pointerUpHandler = () => {
          container.removeEventListener('pointermove', pointerMoveHandler)
          document.removeEventListener('pointerup', pointerUpHandler)
          _pointerUpHandler()
          setPdfState(s => ({ ...s, croppingImage: false }))
          setSelectBoxState(undefined)
        }

        container.addEventListener('pointerdown', pointerDownHandler)
        return () => {
          container.removeEventListener('pointerdown', pointerDownHandler)
        }
      }
    }
  }, [isCroppingImage])

  const renderSelectBox = () => {
    if (selectBoxState) {
      const { start, end } = selectBoxState
      if (!start || !end) return
      const left = Math.min(start.px, end.px)
      const top = Math.min(start.py, end.py)
      const width = Math.abs(start.px - end.px)
      const height = Math.abs(start.py - end.py)
      return (
        <div
          style={{
            position: 'absolute',
            left: `${left * 100}%`,
            top: `${top * 100}%`,
            width: `${width * 100}%`,
            height: `${height * 100}%`,
            zIndex: 1000,
            pointerEvents: 'none',
            background: Colors.Common.SelectColorTransparent
          }}
        ></div>
      )
    }
  }
  return {
    isCroppingImage,
    renderSelectBox
  }
}

export default useCroppingImage
