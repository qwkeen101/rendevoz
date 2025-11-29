import { TabPane, Tabs } from '@/components'
import { Resizable } from 're-resizable'
import EditorLabelController from './Label'
import EditorContents from './Contents'
import { memo } from 'react'
import { useSelectAtomValue, useUpdateEffect } from '@/hooks'
import useEditorState, { EditorStateAtom } from '../hooks/useEditorState'
import useEditorInstance from '../hooks/useEditorInstance'
import { isEqual } from 'lodash'
import { Tab } from '@/components/base/tabs'
import { useTranslation } from 'react-i18next'
import SidebarMetaInfo from '@/core/components/common/SidebarMetaInfo'
import EditorAISummary from '../components/AI/EditorAI'
import { MetaStore } from '@/api/stores'
import CommonSummarySidebar from '@/core/components/ai/CommonSummarySidebar'
import trans from '@/consts/trans'
import CommonExamSidebar from '@/core/components/ai/CommonExamSidebar'
import { slateToMarkdown } from '../plugins/slateToMarkdown'
import askAIExamQuestion from '@/core/ai/chat/askAIExamQuestion'

export default memo(() => {
  const [state, setState] = useEditorState()
  const instance = useEditorInstance()
  const { labels, labelType, metaId, aiSummary, exam } = useSelectAtomValue(
    EditorStateAtom,
    s => ({
      labels: s.labelIds,
      labelType: s.labelType,
      metaId: s.metaId,
      aiSummary: s.aiSummary,
      exam: s.state?.exam
    }),
    { compare: isEqual }
  )
  const visible = state.sidebarVisible
  MetaStore.useValue(metaId)
  useUpdateEffect(() => {
    instance.on({
      type: 'updateNote',
      updater: n => ({
        ...n,
        defaultActiveSidebar: state.sidebarActive,
        defaultSidebarWidth: state.sidebarWidth,
        defaultSidebarVisible: state.sidebarVisible
      })
    })
  }, [state.sidebarActive, state.sidebarWidth, state.sidebarVisible])
  const { t } = useTranslation()
  return (
    <Resizable
      enable={{
        left: true
      }}
      defaultSize={{
        width: state.sidebarWidth,
        height: '100%'
      }}
      minWidth={300}
      maxWidth={'50%'}
      onResizeStop={(e, d, ele) => {
        setState(s => ({ ...s, sidebarWidth: ele.offsetWidth }))
      }}
      className={'border-left'}
      style={{
        position: visible ? 'relative' : 'absolute',
        pointerEvents: visible ? 'auto' : 'none',
        opacity: visible ? 1 : 0
      }}
    >
      <Tabs
        tabNavLeftClassName={'overflow-x-auto font-size-13 no-scrollbar !flex-nowrap'}
        tabNavContainerClassname={'p-2.5 py-1.5 border-bottom'}
        tabNavClassname={'!font-medium !px-1.5 shrink-0 !py-1.5'}
        onTabClick={k => setState(s => ({ ...s, sidebarActive: k }))}
        activeKey={state.sidebarActive}
      >
        {MetaStore.isVisibleMetaObject(metaId, { showDeleted: true, showHidden: true }) ? (
          <TabPane tab={<Tab text={t('general.Info')} />} key="info">
            <SidebarMetaInfo id={metaId} />
          </TabPane>
        ) : null}
        <TabPane key="contents" tab={<Tab text={t('general.Contents')} />}>
          <EditorContents />
        </TabPane>
        <TabPane tab={<Tab text={t('general.Chat')} />} key="ai">
          <EditorAISummary visible={state.sidebarVisible} />
        </TabPane>
        {aiSummary ? (
          <TabPane tab={<Tab text={t(trans.AI.Summary)} />} key="summary">
            <CommonSummarySidebar editorSummary={aiSummary} />
          </TabPane>
        ) : null}
        {exam ? (
          <TabPane tab={<Tab text={t('general.exam')} />} key="exam">
            <CommonExamSidebar
              currentFocusQuestionId={state.currentFocusExamQuestionId}
              source={async question => {
                const chat = instance.aiOps?.getActiveChatId(true)
                if (chat) {
                  setState(s => ({ ...s, sidebarActive: 'ai' }))
                  askAIExamQuestion({
                    chatId: chat,
                    question,
                    initialMessages: instance.aiOps?.getInitialMessages(),
                    parentMetaId: instance.values.metaId
                  })
                }
              }}
              id={exam}
            />
          </TabPane>
        ) : null}
        <TabPane key="label" tab={<Tab text={t('general.Highlights')} count={labels?.length} />} mount>
          <EditorLabelController labelType={labelType} labelIds={labels} />
        </TabPane>
      </Tabs>
    </Resizable>
  )
})
