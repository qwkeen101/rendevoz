import { PdfViewer } from '@/core'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { WhiteboardEventHandler } from '@/events/whiteboardEvent'
import { useDebounceFn } from '@/hooks'
import { useForceUpdate } from 'framer-motion'
import { FC, memo, useEffect } from 'react'
import { IWhiteboardNode } from '~/typings/data'
import { useFlow } from '../../StateHooks'
import { InnerNodeProps } from '../WrapperNode'
import UncontrolledPDF from '@/core/components/pdf/UncontrolledPDF'

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
      forceRender()
      return () => {
        emitter.removeListener('whiteboard', handler)
      }
    }, [])
    console.log(flow.containerTransformScale)
    return (
      <div
        style={{
          minWidth: '100%',
          width: '35rem',
          maxWidth: '100%',
          height: '1000px',
          minHeight: '100%',
          maxHeight: 'inherit',
          overflow: 'hidden'
        }}
      >
        <UncontrolledPDF
          autoWidth={true}
          state={{ doublePage: false, enableSearch: false }}
          id={documentId}
          styles={{
            paddingTop: 15,
            paddingEnd: 15,
            pdfMaxWidth: 999999
          }}
          layout={{
            showHeader: false
          }}
          transformScale={flow.containerTransformScale}
        />
      </div>
    )
  },
  (prev, curr) =>
    (prev.node as IWhiteboardNode & { type: 'pdf' }).documentId === (curr.node as IWhiteboardNode & { type: 'pdf' }).documentId
)

export default PdfNode
