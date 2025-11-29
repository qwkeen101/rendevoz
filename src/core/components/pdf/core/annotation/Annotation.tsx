import { PageViewport, PDFPageProxy } from 'pdfjs-dist'
import { FC } from 'react'
import { IAnnotation } from '~/typings'
import Link from '@/core/components/pdf/components/annotation/Link'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
interface AnnotationProps extends IAnnotation {
  page: PDFPageProxy
  viewport: PageViewport
}
const Annotation: FC<AnnotationProps> = ({ page, viewport, rect, annotationType, ...rest }) => {
  const bound = {
    left: Math.min(rect[0], rect[2]),
    top: page.view[1] + page.view[3] - Math.max(rect[1], rect[3]),
    height: rect[3] - rect[1],
    width: rect[2] - rect[0]
  }
  const instance = usePDFInstance()
  const renderer = () => {
    switch (annotationType) {
      case 2:
        return (
          <Link
            onClick={() => {
              if (rest.url) {
                window.open(rest.url)
              }
              rest.dest && instance.navigateOps?.jumpToDest(rest.dest)
            }}
          />
        )
    }
  }
  return (
    <div
      style={{
        position: 'absolute',
        ...bound,
        transform: `matrix(${viewport.transform.join(',')})`,
        transformOrigin: `-${bound.left}px -${bound.top}px`,
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      {renderer()}
    </div>
  )
}

export default Annotation
