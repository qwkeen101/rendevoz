import { TabPane, Tabs } from '@/components'
import MediaChapterController from './MediaChapterController'
import MediaLabelController from './MediaLabelController'
import { memo } from 'react'
import { Resizable } from 're-resizable'
import { useUpdateEffect } from '@/hooks'
import { useSelectMediaState, useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { Tab } from '@/components/base/tabs'
import { useTranslation } from 'react-i18next'
import SidebarMetaInfo from '@/core/components/common/SidebarMetaInfo'
import YoutubePlaylistView from '@/core/components/media/components/YoutubePlaylistView'
import MediaSubtitle from '@/core/components/media/components/sidebar/Subtitle'
import MediaAI from '@/core/components/media/components/AI/MediaAI'
import trans from '@/consts/trans'
import CommonSummarySidebar from '@/core/components/ai/CommonSummarySidebar'
import { MetaStore } from '@/api/stores'
import CommonExamSidebar from '@/core/components/ai/CommonExamSidebar'
import askAIExamQuestion from '@/core/ai/chat/askAIExamQuestion'

const MediaSidebar = memo(() => {
  const setState = useSetMediaState()
  const instance = useMediaInstance()
  const { labelIds, metaId, exam, chapters, currentFocusQuestionId, ytPlaylistId, aiSummary, visible, active, width } = useSelectMediaState(
    state => ({
      labelIds: state.labels,
      metaId: state.metaId,
      chapters: state.sortedChapters?.length,
      aiSummary: state.aiSummary,
      exam: state.exam,
      ytPlaylistId: state.state?.ytPlaylistId,
      visible: state.sidebarVisible,
      active: state.sidebarActive,
      width: state.sidebarWidth,
      currentFocusQuestionId: state.currentFocusQuestionId
    })
  )
  useUpdateEffect(() => {
    instance.on?.({
      type: 'externalStateChange',
      state: {
        defaultActiveSidebar: active,
        defaultSidebarVisible: visible
      }
    })
  }, [active, visible])
  const { t } = useTranslation()
  return (
    <>
      <Resizable
        size={{
          height: '100%',
          width: width
        }}
        onResizeStop={(event, direction, elementRef) => {
          setState(s => ({ ...s, sidebarWidth: elementRef.clientWidth }))
        }}
        minWidth={300}
        maxWidth={1000}
        enable={{
          left: true
        }}
        style={{
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          position: visible ? 'relative' : 'absolute'
        }}
      >
        <div className={'flex h-full flex-col grow overflow-hidden border-left'}>
          <Tabs
            activeKey={active}
            tabNavLeftClassName={'overflow-x-auto font-size-13 no-scrollbar !flex-nowrap'}
            tabNavContainerClassname={'p-2.5 py-1.5 border-bottom'}
            tabNavClassname={'!font-medium !px-1.5 shrink-0 !py-1.5'}
            onTabClick={k => setState(s => ({ ...s, sidebarActive: k }))}
          >
            {MetaStore.isVisibleMetaObject(metaId, { showHidden: true, showDeleted: true }) ? (
              <TabPane key={'info'} tab={<Tab text={t('general.Info')} />}>
                <SidebarMetaInfo id={metaId} />
              </TabPane>
            ) : null}
            <TabPane className={'flex flex-col'} key={'ai'} tab={<Tab text={t('general.Chat')} />}>
              <MediaAI />
            </TabPane>
            {aiSummary ? (
              <TabPane key={'summary'} tab={<Tab text={t(trans.AI.Summary)} />}>
                <CommonSummarySidebar mediaSummary={aiSummary} />
              </TabPane>
            ) : null}
            {exam ? (
              <TabPane key={'exam'} tab={<Tab text={t('general.exam')} />}>
                <CommonExamSidebar
                  currentFocusQuestionId={currentFocusQuestionId}
                  source={async question => {
                    const chat = instance.aiOps?.getActiveChatId(true)
                    if (chat) {
                      setState(s => ({ ...s, sidebarActive: 'ai' }))
                      askAIExamQuestion({
                        chatId: chat,
                        question,
                        initialMessages: await instance.aiOps?.getInitialMessages(),
                        parentMetaId: metaId
                      })
                    }
                  }}
                  id={exam}
                />
              </TabPane>
            ) : null}
            <TabPane key='subtitles' tab={<Tab text={t('general.Subtitles')} />}>
              <MediaSubtitle />
            </TabPane>
            <TabPane key='label' tab={<Tab text={t('general.Highlights')} count={labelIds?.length} />}>
              <MediaLabelController />
            </TabPane>
            {chapters ? (
              <TabPane key='chapter' tab={<Tab text={t('general.Chapters')} count={chapters} />}>
                <MediaChapterController />
              </TabPane>
            ) : null}
            {ytPlaylistId ? (
              <TabPane key='playlist' tab={<Tab text={t('feed.Playlist')} />}>
                <YoutubePlaylistView />
              </TabPane>
            ) : null}
          </Tabs>
        </div>
      </Resizable>
    </>
  )
})

export default MediaSidebar
