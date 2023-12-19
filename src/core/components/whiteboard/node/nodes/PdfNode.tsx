import { PdfViewer } from '@/core'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { WhiteboardEventHandler } from '@/events/whiteboardEvent'
import { useDebounceFn } from '@/hooks'
import { useForceUpdate } from 'framer-motion'
import { FC, memo, useEffect } from 'react'
import { IWhiteboardNode } from '~/typings/data'
import { useFlow } from '../../StateHooks'
import { InnerNodeProps } from '../WrapperNode'
import Pdf from '@/core/components/pdf'

const PdfNode: FC<InnerNodeProps> = memo(
  ({ node }) => {
    const { documentId } = node as IWhiteboardNode & { type: 'pdf' }
    const flow = useFlow()
    const emitter = useScopedEventEmitter()
    const [forceRender] = useForceUpdate()
    const { run: debouncedForceRender } = useDebounceFn(forceRender, {
      wait: 500
    })
    useEffect(() => {
      const handler = new WhiteboardEventHandler()
      handler.on('zoomChange', () => {
        debouncedForceRender()
      })
      emitter.addListener('whiteboard', handler)
      return () => {
        emitter.removeListener('whiteboard', handler)
      }
    }, [])
    return (
      <div
        style={{
          minWidth: '100%',
          width: '35rem',
          maxWidth: '100%',
          height: '45rem',
          minHeight: '100%',
          maxHeight: '100%',
          overflow: 'hidden'
        }}
      >
        <Pdf pdfId={documentId} transformScale={flow.containerTransformScale} />
      </div>
    )
  },
  (prev, curr) =>
    (prev.node as IWhiteboardNode & { type: 'pdf' }).documentId === (curr.node as IWhiteboardNode & { type: 'pdf' }).documentId
)

export default PdfNode
