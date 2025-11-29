import { memo } from 'react'
import { useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import SummaryToolbar from '@/core/components/ai/SummaryToolbar'
import toast from 'react-hot-toast'
import { IMediaAiSummary } from '~/typings'

export default memo(({ summary }: { summary: IMediaAiSummary }) => {
  const setState = useSetMediaState()
  const instance = useMediaInstance()
  const { t } = useTranslation()
  const getSummary = () => {
    return `${summary.summary.summary}\n ${summary.summary.takeaways.map(i => `- ${i.description}`).join('\n')}`
  }
  const getContent = async () => {
    const subtitles = await instance.getSubtitle?.()
    return `Summarize the article below: ${subtitles?.map(i => i.text).join('')}`
  }
  return (
    <div className={'p-4 pt-0 max-h-full overflow-y-auto'}>
      <div className={'small-transparent mt-1 mb-1.5'}>{t(trans.AI.Overview)}</div>
      <div>{summary.summary.summary}</div>
      <div className={'small-transparent mt-3 mb-1.5'}>{t(trans.AI.Takeaways)}</div>
      <ul className={'flex flex-col list-disc gap-1.5'}>
        {summary.summary.takeaways.map(i => (
          <li
            className={'cursor-pointer'}
            onClick={() => {
              if (!window.getSelection()?.toString()) {
                instance.actionOps?.jumpTo(i.time)
              }
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
              setState(s => ({ ...s, sidebarActive: 'ai' }))
              instance.on?.({
                type: 'removeSummary'
              })
              break
            }
            case 'copy': {
              const sum = getSummary()
              navigator.clipboard.writeText(sum)
              toast.success(t(trans.Copied))
              break
            }
            case 'chat': {
              Global.aiOps?.chat?.({
                messages: [
                  {
                    role: 'user',
                    content: await getContent(),
                    type: 'summarize',
                    source: await instance.on?.({ type: 'getSource' })
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
      />
    </div>
  )
})
