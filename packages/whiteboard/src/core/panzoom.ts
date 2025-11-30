import panzoom, { PanZoom, PanZoomHandler } from 'panzoom'
import { RefObject, useEffect } from 'react'
import { IWhiteboardInstance } from '../types'

type UsePanzoomParams = {
  containerRef: RefObject<HTMLElement>
  instance: IWhiteboardInstance
}

export const usePanzoom = ({ containerRef, instance }: UsePanzoomParams) => {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const pz = panzoom(el, {
      smoothScroll: false,
      minZoom: 0.25,
      maxZoom: 3,
      zoomDoubleClickSpeed: 1,
      autocenter: true,
      bounds: false,
      beforeWheel: () => !instance.getState?.().readOnly
    })

    const handle = (e: PanZoomHandler) => {
      const transform = pz.getTransform()
      instance.coordOps?.setTransform?.({
        x: transform.x,
        y: transform.y,
        scale: transform.scale
      })
    }
    pz.on('transform', handle)

    return () => {
      pz.off('transform', handle)
      pz.dispose()
    }
  }, [containerRef, instance])
}
