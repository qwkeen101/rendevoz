import { PageViewport, PDFPageProxy } from 'pdfjs-dist'
import { FC, memo, useMemo, useState } from 'react'
import { useIsomorphicLayoutEffect } from 'react-use'
import Annotation from '../annotation/Annotation'
import { IAnnotation } from '~/typings'
interface AnnotationLayerProps {
  page: PDFPageProxy
  width: number
  height: number
  viewport: PageViewport
  scale?: number
}

const AnnotationLayer: FC<AnnotationLayerProps> = ({ page, width, height, scale, viewport }) => {
  const [annotations, setAnnotations] = useState<IAnnotation[]>()
  useIsomorphicLayoutEffect(() => {
    page.getAnnotations({ intent: 'display' }).then(data => {
      setAnnotations(data.filter(i => !i?.parentId))
    })
  }, [])
  const clonedViewport = useMemo(() => viewport.clone({ dontFlip: true }), [viewport])
  if (!annotations?.length) return null
  return (
    <div
      style={{
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
        pointerEvents: 'none'
      }}
      role="annotation-layer"
    >
      {annotations.map((i, idx) => (
        <Annotation key={idx} {...i} page={page} viewport={clonedViewport} />
      ))}
    </div>
  )
}

export default memo(AnnotationLayer)
