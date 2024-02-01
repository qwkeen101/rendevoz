import { Content, Icon, TabPane, Tabs } from '@/components'
import usePdfBarState from '../../hooks/usePdfBarState'
import PdfLabelController from './PdfLabelController'
import { Resizable } from 're-resizable'
import PdfSearch from '../floatbar/Search'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import { Trans, useTranslation } from 'react-i18next'
import { useDebounceEffect, useSelectAtomValue } from '@/hooks'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import AskAIPanel from '@/core/ai/components/AskAIPanel'
import { MetaStore, ObjectStore } from '@/api/stores'
import { AI_QUESTION_PROP_ID, AI_SUMMARY_PROP_ID } from '@/api/stores/meta/meta.store'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
import { useEffect, useMemo, useState } from 'react'
import { useUpdate } from 'react-use'
import { truncate } from 'lodash'
import { IQuestion } from '~/typings'
import Id from '@/utils/id'

const PdfRightSidebar = ({ pdfId }: { pdfId: number }) => {
  const pdfMeta = MetaStore.useObjectToMetaValue(pdfId)
  const [pdfBarState, setPdfBarState] = usePdfBarState()
  const { t } = useTranslation()
  const instance = usePdfInstance()
  const content = instance.getTextOfPages?.()
  const update = useUpdate()
  useEffect(() => {
    const inter = setInterval(() => {
      update()
    }, 500)
    return () => {
      clearInterval(inter)
    }
  }, [])

  const labelIds = useSelectAtomValue(PdfStateAtom, s => s.document?.labels)
  const [onlySummarize, setOnlySummarize] = useState<{
    start?: number
    end?: number
  }>({ start: undefined, end: undefined })
  const [stringContent, setStringContent] = useState<string>('')
  useDebounceEffect(
    () => {
      if (content?.length) {
        if (onlySummarize.start && onlySummarize.end) {
          const c = content.map(i => ({ id: i.id, text: i.str })).slice(onlySummarize.start - 1, onlySummarize.end)
          console.log(c)
          setStringContent(JSON.stringify(c))
        } else {
          setStringContent(JSON.stringify(content.map(i => ({ id: i.id, text: i.str }))))
        }
      }
    },
    [content?.length, onlySummarize],
    { wait: 500 }
  )

  return (
    <Resizable
      defaultSize={{
        width: pdfBarState.rightBarWidth,
        height: '100%'
      }}
      onResizeStop={(e, dir, ele) =>
        setPdfBarState(s => ({
          ...s,
          rightBarWidth: ele.getBoundingClientRect().width
        }))
      }
      handleStyles={{
        left: {
          left: 0
        }
      }}
      maxWidth={'50%'}
      minWidth={200}
      enable={{
        left: true
      }}
      style={{
        height: '100%',
        position: pdfBarState.showRightBar ? 'relative' : 'absolute',
        right: 0,
        top: 0,
        // transform: pdfBarState.showRightBar ? 'translateX(0)' : 'translateX(100%)',
        transition: 'opacity 0.3s ease',
        opacity: pdfBarState.showRightBar ? 1 : 0,
        pointerEvents: pdfBarState.showRightBar ? 'auto' : 'none',
        zIndex: pdfBarState.showRightBar ? 40 : -1,
        background: Colors.Background.Global,
        borderLeft: '1px solid var(--border-background)'
      }}
    >
      <Tabs
        extra={
          <Icon
            name="park-double-right"
            className={ClassName.circleButton()}
            onClick={() => setPdfBarState(s => ({ ...s, showRightBar: false }))}
          />
        }
        defaultActiveKey="search"
        activeKey={pdfBarState.rightBarActive}
        tabNavContainerStyle={{
          padding: '12px 12px 0px'
        }}
        onTabClick={key => setPdfBarState(s => ({ ...s, rightBarActive: key }))}
      >
        <TabPane
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-search" />
              {t('general.search')}
            </Content>
          }
          key="search"
        >
          <PdfSearch />
        </TabPane>
        <TabPane
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-label" />
              {t('general.label')}
            </Content>
          }
          key="label"
        >
          <PdfLabelController labelIds={labelIds} />
        </TabPane>
        <TabPane
          key="ai"
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="custom-magic" />
              {t('general.Ask AI')}
            </Content>
          }
        >
          {pdfMeta && stringContent && (
            <AskAIPanel
              questions={pdfMeta.properties?.[AI_QUESTION_PROP_ID]?.value}
              summary={pdfMeta.properties?.[AI_SUMMARY_PROP_ID]?.value}
              content={stringContent}
              onSummarized={async e => {
                const newQuestions = e.questions
                  .map(i => {
                    if (i.answerType === 'pointer') {
                      return {
                        ...i,
                        answerPointers: i.answerPointers
                          .map(id => {
                            const page = content?.find(o => o.id === id)
                            if (page) {
                              return {
                                id: Id.getId(),
                                pointerType: 'pdfPage',
                                page: page.page,
                                pageStr: truncate(page.str, { length: 300 })
                              }
                            }
                          })
                          .filter(i => i) as IQuestion['answerPointers'][0][]
                      } as Partial<IQuestion>
                    }
                  })
                  .filter(i => i) as Partial<IQuestion>[]
                const ids = (
                  await Promise.all(newQuestions.map(async i => await ObjectStore('question').addOne({ ...i, parentObjectId: pdfId })))
                ).map(i => i.id)
                await MetaStore.addAIForMeta(pdfMeta.id, {
                  questions: ids,
                  summary: e.summary
                })
              }}
              extraPlaceholder={() => {
                return (
                  <Content className={'font-size-14'}>
                    <Trans
                      i18nKey={'ai.Only summarize'}
                      components={{
                        component: (
                          <input
                            value={onlySummarize.start}
                            className={ClassName.noStyleInput}
                            onChange={e => {
                              if (e.target.value) {
                                setOnlySummarize(s => ({
                                  ...s,
                                  start: Math.min(s.end || (content?.length ?? 1), Math.max(1, Number(e.target.value) || 1))
                                }))
                              } else {
                                setOnlySummarize(s => ({
                                  ...s,
                                  start: undefined
                                }))
                              }
                            }}
                            style={{
                              borderBottom: Colors.Consts.Border,
                              width: '3em',
                              textAlign: 'center'
                            }}
                          />
                        ),
                        component1: (
                          <input
                            value={onlySummarize.end}
                            className={ClassName.noStyleInput}
                            onChange={e => {
                              if (e.target.value) {
                                setOnlySummarize(s => ({
                                  ...s,
                                  end: Math.min(content?.length ?? 1, Math.max(Number(e.target.value) || 0, onlySummarize.start ?? 0))
                                }))
                              } else {
                                setOnlySummarize(s => ({ ...s, end: undefined }))
                              }
                            }}
                            style={{
                              width: '3em',
                              textAlign: 'center',
                              borderBottom: Colors.Consts.Border
                            }}
                          />
                        )
                      }}
                    ></Trans>
                  </Content>
                )
              }}
            />
          )}
        </TabPane>
      </Tabs>
    </Resizable>
  )
}

export default PdfRightSidebar
