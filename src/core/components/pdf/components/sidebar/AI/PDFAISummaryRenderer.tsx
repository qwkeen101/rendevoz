import { memo } from 'react'
import usePDFState from '@/core/components/pdf/hooks/usePDFState'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import SummaryToolbar from '@/core/components/ai/SummaryToolbar'
import toast from 'react-hot-toast'

export default memo(() => {
  const [state, setState] = usePDFState()
  const instance = usePDFInstance()
  const aiSummary = state.state?.aiSummary
  const { t } = useTranslation()
  if (aiSummary) {
    const getContent = () => {
      const pages = instance.values.texts.map(i => i.str).join(' ')
      return `Summarize the article below: ${pages}`
    }
    const getSummary = () => {
      return `${aiSummary.summary.summary}\n ${aiSummary.summary.takeaways.map(i => `- ${i.description}`).join('\n')}`
    }
    return (
      <div className={'p-4 pt-0 max-h-full overflow-y-auto'}>
        <div className={'small-transparent mt-1 mb-1.5'}>{t(trans.AI.Overview)}</div>
        <div>{aiSummary.summary.summary}</div>
        <div className={'small-transparent mt-3 mb-1.5'}>{t(trans.AI.Keywords)}</div>
        <div className={'flex flex-wrap gap-x-2'}>
          {aiSummary.summary.keywords.map(i => (
            <div key={i}>{i}</div>
          ))}
        </div>
        <div className={'small-transparent mt-3 mb-1.5'}>{t(trans.AI.Takeaways)}</div>
        <ul className={'flex flex-col gap-1.5 list-disc'}>
          {aiSummary.summary.takeaways.map(i => (
            <li
              className={'cursor-pointer'}
              title={i.quote}
              onClick={() => {
                instance.navigateOps?.jumpToPage(i.pageNumber)
              }}
              key={i.description}
            >
              {i.description}
            </li>
          ))}
        </ul>
        <SummaryToolbar
          on={async type => {
            switch (type) {
              case 'delete': {
                instance.on?.({ type: 'removeSummary' })
                setState(s => ({ ...s, sidebarActive: 'ai' }))
                break
              }
              case 'copy': {
                navigator.clipboard.writeText(getSummary())
                toast.success(t(trans.Copied))
                break
              }
              case 'chat': {
                Global.aiOps?.chat?.({
                  messages: [
                    {
                      role: 'user',
                      content: getContent(),
                      type: 'summarize',
                      source: {
                        type: 'pdf',
                        objectId: instance.getId()
                      }
                    },
                    {
                      role: 'assistant',
                      content: getSummary()
                    }
                  ]
                })
                break
              }
            }
          }}
        ></SummaryToolbar>
      </div>
    )
  }
})
