import { IEditorAISummary } from '~/typings'
import { memo, useRef } from 'react'
import useEditorState from '@/core/components/editor/hooks/useEditorState'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

export default memo(() => {
  const [editorState] = useEditorState()
  const { aiSummary } = editorState
  const ref = useRef<HTMLDivElement>(null)
  if (aiSummary) {
    return (
      <div ref={ref} className={'p-2.5 pb-20 pt-0 max-h-full overflow-y-auto'}>
        {aiSummary.outlines.map((i, idx) => (
          <Outline showBorderTop={idx > 0} key={idx} outline={i} />
        ))}
      </div>
    )
  }
})
const Outline = ({ outline, showBorderTop }: { outline: IEditorAISummary['outlines'][0]; showBorderTop?: boolean }) => {
  const instance = useEditorInstance()
  const titleRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <div className={showBorderTop ? 'pt-3 border-top mt-3' : ''} ref={containerRef}>
      <div
        onClick={() => {
          if (!window.getSelection()?.toString()) {
            instance.scrollToBlock?.({ blockId: outline.id, highlight: true })
          }
        }}
        ref={titleRef}
        className={'button font-size-15'}
      >
        <div className={'font-medium mb-0.5'}>{outline.title}</div>
        <div className={'font-size-12'}>{outline.description}</div>
      </div>
      {outline.highlights.map((i, idx) => (
        <div
          onClick={() => {
            if (!window.getSelection()?.toString()) {
              instance.scrollToBlock?.({ blockId: i.id, highlight: true })
            }
          }}
          key={idx}
          className={'button'}
        >
          {i.description}
        </div>
      ))}
    </div>
  )
}
