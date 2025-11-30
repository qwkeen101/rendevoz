import { memo } from 'react'
import useEditorState from '../hooks/useEditorState'
import useEditorInstance from '../hooks/useEditorInstance'
import { useTranslation } from 'react-i18next'
import trans from '../consts/trans'
import SummaryToolbar from '@/core/components/ai/SummaryToolbar'
import toast from 'react-hot-toast'
export default memo(() => {
  const [editorState] = useEditorState()
  const instance = useEditorInstance()
  const { aiSummary } = editorState
  const { t } = useTranslation()
  if (aiSummary) {
    const getContent = () => {
      const str = instance.serialize()
      if (str) {
        const title = editorState.stringTitle || ''
        return `Summarize the article ${title} below: ${str}`
      }
    }
    const getSummary = () => {
      return `${aiSummary.summary.summary}\n ${aiSummary.summary.takeaways.map(i => `- ${i.description}`).join('\n')}`
    }
    return (
      <div className={'p-4 pt-0 max-h-full overflow-y-auto'}>
        <div className={'small-transparent mt-1 mb-1.5'}>{t(trans.AI.Overview)}</div>
        <div>{aiSummary.summary.summary}</div>
        <div className={'small-transparent mb-1.5 mt-3'}>{t(trans.AI.Keywords)}</div>
        <div className={'flex flex-wrap gap-x-2'}>
          {aiSummary.summary.keywords.map(i => (
            <div key={i}>{i}</div>
          ))}
        </div>
        <div className={'small-transparent mb-1.5 mt-3'}>{t(trans.AI.Takeaways)}</div>
        <ol className={'flex flex-col gap-1.5 list-disc'}>
          {aiSummary.summary.takeaways.map(i => (
            <li
              className={'cursor-pointer'}
              onClick={() => {
                if (!window.getSelection()?.toString()) {
                  instance.scrollToBlock?.({ blockId: i.id, highlight: true })
                }
              }}
              key={i.description}
            >
              {i.description}
            </li>
          ))}
        </ol>
        <SummaryToolbar
          on={async type => {
            switch (type) {
              case 'delete': {
                instance.on({ type: 'removeSummary' })
                break
              }
              case 'chat': {
                const source = await instance.on({ type: 'getSource' })
                Global.aiOps?.chat?.({
                  messages: [
                    {
                      role: 'user',
                      content: getContent(),
                      type: 'summarize',
                      source
                    },
                    {
                      role: 'assistant',
                      content: getSummary()
                    }
                  ]
                })
                break
              }
              case 'copy': {
                const sum = getSummary()
                navigator.clipboard.writeText(sum)
                toast.success(t(trans.Copied))
                break
              }
            }
          }}
        ></SummaryToolbar>
      </div>
    )
  }
})
