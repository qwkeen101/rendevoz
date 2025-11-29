import { Markdown, TabPane, Tabs } from '@/components'
import { Tab } from '@/components/base/tabs'
import { useTranslation } from 'react-i18next'
import { Trans } from '@/consts'
import CommonSummarySidebar from '../../ai/CommonSummarySidebar'
import { useSelectMediaState } from '../../media/hooks/useMediaState'
import MediaSubtitle from '../../media/components/sidebar/Subtitle'
import MediaLabelController from '../../media/components/sidebar/MediaLabelController'
import MediaChapterController from '../../media/components/sidebar/MediaChapterController'
import { memo } from 'react'

export default memo(() => {
  const { t } = useTranslation()
  const { labelIds, chapters, description, aiSummary } = useSelectMediaState(state => ({
    labelIds: state.labels,
    metaId: state.metaId,
    chapters: state.sortedChapters?.length,
    aiSummary: state.aiSummary,
    exam: state.exam,
    ytPlaylistId: state.state?.ytPlaylistId,
    visible: state.sidebarVisible,
    active: state.sidebarActive,
    width: state.sidebarWidth,
    description: state.description,
    currentFocusQuestionId: state.currentFocusQuestionId
  }))
  return (
    <Tabs
      container={false}
      tabNavMode='underline'
      renderOnly
      defaultActiveKey='description'
      tabNavContainerClassname='my-6'
      tabNavClassname={'!font-medium !px-0 shrink-0 font-size-16 !py-1.5 !mr-8'}
    >
      <TabPane key={'description'} className='whitespace-pre-wrap text-lg' tab={<Tab text={t(Trans.Description)} />}>
        <Markdown>{description}</Markdown>
      </TabPane>
      {aiSummary ? (
        <TabPane key={'summary'} tab={<Tab text={t(Trans.AI.Summary)} />}>
          <CommonSummarySidebar mediaSummary={aiSummary} />
        </TabPane>
      ) : null}
      <TabPane key='subtitles' className='flex flex-1 flex-col' tab={<Tab text={t('general.Subtitles')} />}>
        <MediaSubtitle />
      </TabPane>
      <TabPane key='label' className='flex flex-1 flex-col' tab={<Tab text={t('general.Highlights')} count={labelIds?.length} />}>
        <MediaLabelController />
      </TabPane>
      {chapters ? (
        <TabPane key='chapter' tab={<Tab text={t('general.Chapters')} count={chapters} />}>
          <MediaChapterController />
        </TabPane>
      ) : null}
    </Tabs>
  )
})
