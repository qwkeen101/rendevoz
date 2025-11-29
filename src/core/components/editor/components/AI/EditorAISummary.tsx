import useMediaState from '@/core/components/media/hooks/useMediaState'
import MediaAISummaryRenderer from '@/core/components/media/components/AI/MediaAISummaryRenderer'
import MediaAIOutlineRenderer from '@/core/components/media/components/AI/MediaAIOutlineRenderer'
import { memo } from 'react'
import classnames from 'classnames'
import MediaMindmap from '@/core/components/media/components/AI/MediaMindmap'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export default memo(() => {
  const [mediaState, setMediaState] = useMediaState()
  const { t } = useTranslation()
  if (mediaState.aiSummary) {
    const active = mediaState.aiSummaryTab ?? 'summary'
    return (
      <div className={'flex grow flex-col max-h-full'}>
        <div className={'flex flex-wrap gap-3 justify-between p-6 pt-4 items-center pb-3'}>
          <div className={'text-xl font-semibold'}>{t(trans.AI.AISummary)}</div>
          <div className={'flex bg-secondary rounded-full p-1 font-size-12 font-semibold'}>
            <div
              onClick={() => setMediaState(s => ({ ...s, aiSummaryTab: 'summary' }))}
              className={classnames('button !px-2.5 !rounded-full', active === 'summary' && 'active-button')}
            >
              {t(trans.AI.Summary)}
            </div>
            <div
              onClick={() => setMediaState(s => ({ ...s, aiSummaryTab: 'outlines' }))}
              className={classnames('button !px-2.5 !rounded-full', active === 'outlines' && 'active-button')}
            >
              {t(trans.AI.Outline)}
            </div>
            <div
              onClick={() => setMediaState(s => ({ ...s, aiSummaryTab: 'mindmap' }))}
              className={classnames('button !px-2.5 !rounded-full', active === 'mindmap' && 'active-button')}
            >
              {t(trans.AI.Mindmap)}
            </div>
          </div>
        </div>
        <MediaAISummaryRenderer active={active === 'summary'} />
        <MediaAIOutlineRenderer active={active === 'outlines'} />
        <MediaMindmap active={active === 'mindmap'} />
      </div>
    )
  }
})
