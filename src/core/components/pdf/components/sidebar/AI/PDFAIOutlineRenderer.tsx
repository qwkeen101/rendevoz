import { IPDFAiSummary } from '~/typings'
import { memo, useRef } from 'react'
import usePDFState from '@/core/components/pdf/hooks/usePDFState'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'

export default memo(() => {
  const [pdfState] = usePDFState()
  const { aiSummary } = pdfState.document ?? {}
  const ref = useRef<HTMLDivElement>(null)
  if (aiSummary) {
    return (
      <div ref={ref} className={'p-2.5 pt-0 max-h-full overflow-y-auto pb-20'}>
        {aiSummary.outlines.map((i, idx, arr) => (
          <Outline showBorderTop={idx > 0} key={idx} outline={i} />
        ))}
      </div>
    )
  }
})

const Outline = ({ outline, showBorderTop }: { outline: IPDFAiSummary['outlines'][0]; showBorderTop?: boolean }) => {
  const instance = usePDFInstance()
  const titleRef = useRef<HTMLDivElement>(null)
  const start = outline.pageNumber
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className={showBorderTop ? 'pt-3 border-top mt-3' : ''} ref={containerRef}>
      <div
        onClick={() => {
          instance.navigateOps?.jumpToPage(start)
        }}
        ref={titleRef}
        className={'button font-size-15'}
      >
        <div className={'font-medium mb-0.5'}>{outline.title}</div>
        <div className={'font-size-12'}>{outline.description}</div>
      </div>
      {outline.highlights.map((i, idx) => (
        <div
          data-index={idx}
          onClick={() => {
            instance.highlightText?.(i.quote, i.pageNumber)
          }}
          key={i.description}
          className={'button'}
        >
          {i.description}
        </div>
      ))}
    </div>
  )
}
