import { PageViewport, PDFPageProxy } from 'pdfjs-dist'
import { FC, memo, ReactElement, useMemo, useState } from 'react'
import { useIsomorphicLayoutEffect } from 'react-use'
import Annotation from '../annotation/Annotation'
import { IAnnotation } from '../types/annotation'
import {AnnotationEditorType} from 'pdfjs-dist'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
interface AnnotationLayerProps {
  page: PDFPageProxy
  width: number
  height: number
  viewport: PageViewport
  scale?: number
  renderAnnotation?: (annotation: IAnnotation) => ReactElement
}

const AnnotationLayer: FC<AnnotationLayerProps> = ({ page, width, height, scale, viewport, renderAnnotation }) => {
  const [annotations, setAnnotations] = useState<IAnnotation[]>()
  const instance = usePdfInstance()
  useIsomorphicLayoutEffect(() => {
    page.getAnnotations({ intent: 'display' }).then(data => {
      console.log(data)
      // instance.getDocument?.().then(doc => {
      //   const newAnnotation = {
      //     annotationType: 15,
      //     color: [255, 0, 0],
      //     thickness: 3,
      //     opacity: 1,
      //     paths: [{
      //       bezier: [
      //         1.5, 25.727771084724367, 2.8040804485100495, 27.031851533234402,
      //         5.396811581133676, 23.25556095123241, 6, 22.727771084724367,
      //         10.45407020558315, 18.830459654839103, 15.981183968598401,
      //         16.364531104350363, 21, 13.227771084724367, 25.88795894206055,
      //         10.172796745936523, 37.988543516372076, 5.739227568352277, 42,
      //         1.7277710847243668
      //       ],
      //       points: [
      //         1.5, 25.727771084724367, 5.225791198862495, 23.602568747729173,
      //         4.012834511116397, 24.914722452856147, 6, 22.727771084724367, 21,
      //         13.227771084724367, 37.71378602219673, 4.78737352236285,
      //         31.828688421912233, 7.836451889039392, 42, 1.7277710847243668
      //       ]
      //     }],
      //     pageIndex: 3,
      //     rect: [71.5, 534.5, 115, 562],
      //     rotation: 0
      //   }

          // doc.annotationStorage.setValue('pdfjs_internal_editor_1', newAnnotation)
          // doc.saveDocument().then((data) => {
          //   console.log(doc.annotationStorage)
          //   const blob = new Blob([data])
          //   const a = document.createElement('a')
          //   a.download = 'x.pdf'
          //   a.href = URL.createObjectURL(blob)
          //   a.click()
          // })


      // })



    setAnnotations(data)
    })
  }, [])
  const clonedViewport = useMemo(() => viewport.clone({ dontFlip: true }), [viewport])

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
      {annotations
        ?.filter(i => !i?.parentId)
        .map((i, idx) => (
          <Annotation key={idx} {...i} page={page} viewport={clonedViewport} renderAnnotation={renderAnnotation} />
        ))}
    </div>
  )
}

export default memo(AnnotationLayer)
