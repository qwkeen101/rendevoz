import { Resizable } from 're-resizable'
import { TabPane, Tabs } from '@/components'
import { memo } from 'react'
import { useUpdateEffect } from '@/hooks'
import usePDFState from '@/core/components/pdf/hooks/usePDFState'
import PDFLabel from '@/core/components/pdf/components/sidebar/Label'
import { Tab } from '@/components/base/tabs'
import { useTranslation } from 'react-i18next'
import SidebarMetaInfo from '@/core/components/common/SidebarMetaInfo'
import Content from '@/core/components/pdf/components/sidebar/Content'
import PDFAISummary from '@/core/components/pdf/components/sidebar/AI/PDFAI'
import trans from '@/consts/trans'
import CommonSummarySidebar from '@/core/components/ai/CommonSummarySidebar'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import CommonExamSidebar from '@/core/components/ai/CommonExamSidebar'
import askAIExamQuestion from '@/core/ai/chat/askAIExamQuestion'

export default memo(({ id }: { id: number }) => {
  const [state, setState] = usePDFState()
  const instance = usePDFInstance()
  useUpdateEffect(() => {
    instance.on({
      type: 'stateChange',
      state: {
        defaultActiveSidebar: state.sidebarActive,
        defaultSidebarVisible: state.sidebarVisible
      }
    })
  }, [state.sidebarActive, state.sidebarVisible])
  const showSidebar = state.sidebarVisible
  const { t } = useTranslation()
  return (
    <Resizable
      defaultSize={{
        width: state.sidebarWidth,
        height: '100%'
      }}
      onResizeStop={(e, dir, ele) =>
        setState(s => ({
          ...s,
          sidebarWidth: ele.getBoundingClientRect().width
        }))
      }
      enable={{
        left: true
      }}
      maxWidth={'50%'}
      className={'border-left'}
      minWidth={340}
      style={{
        height: '100%',
        position: showSidebar ? 'relative' : 'absolute',
        right: 0,
        pointerEvents: showSidebar ? 'auto' : 'none',
        opacity: showSidebar ? 1 : 0
      }}
    >
      <Tabs
        tabNavLeftClassName={'overflow-x-auto font-size-13 no-scrollbar !flex-nowrap'}
        tabNavContainerClassname={'p-2.5 py-2 border-bottom'}
        tabNavClassname={'!font-medium !px-1.5 shrink-0 !py-1'}
        activeKey={state.sidebarActive}
        onTabClick={k => setState(s => ({ ...s, sidebarActive: k }))}
      >
        {state.state?.metaId ? (
          <TabPane key={'info'} tab={<Tab text={t('general.Info')} />}>
            <SidebarMetaInfo id={state.state.metaId} />
          </TabPane>
        ) : null}
        <TabPane key="content" tab={<Tab text={t('general.Content')} />}>
          <Content id={id} />
        </TabPane>
        <TabPane key={'ai'} tab={<Tab text={t('general.Chat')} />}>
          <PDFAISummary />
        </TabPane>
        {state.state?.aiSummary ? (
          <TabPane key={'summary'} tab={<Tab text={t(trans.AI.Summary)} />}>
            <CommonSummarySidebar pdfSummary={state.state.aiSummary} />
          </TabPane>
        ) : null}
        {state.state?.exam ? (
          <TabPane key={'exam'} tab={<Tab text={t('general.exam')} />}>
            <CommonExamSidebar
              source={async question => {
                const chat = instance.aiOps?.getActiveChatId(true)
                if (chat) {
                  setState(s => ({ ...s, sidebarActive: 'ai' }))
                  askAIExamQuestion({
                    chatId: chat,
                    question,
                    initialMessages: await instance.aiOps?.getInitialMessages(),
                    parentMetaId: state.state?.metaId
                  })
                }
              }}
              id={state.state.exam}
              currentFocusQuestionId={state.currentFocusQuestionId}
            />
          </TabPane>
        ) : null}
        <TabPane key="label" tab={<Tab text={t('general.Highlights')} count={state.state?.labelIds?.length} />} mount>
          <PDFLabel
            labelState={{
              ...state.state
            }}
            labelIds={state.state?.labelIds}
            onLabelStateChange={s => {
              instance.on({
                type: 'stateChange',
                state: s
              })
            }}
          />
        </TabPane>
      </Tabs>
    </Resizable>
  )
})
