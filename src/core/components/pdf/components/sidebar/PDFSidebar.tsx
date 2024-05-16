import usePDFBarState from '@/core/components/pdf/hooks/usePDFBarState'
import { Resizable } from 're-resizable'
import Colors from '@/consts/colors'
import { Content, Icon, TabPane, Tabs } from '@/components'
import { ClassName } from 'rendevoz'
import PDFThumbnail from '@/core/components/pdf/components/sidebar/Thumbnail'
import PdfOutline from '@/core/components/pdf/components/sidebar/Outline'
import PDFSearch from '@/core/components/pdf/components/sidebar/Search'
import PDFMindmap from '@/core/components/pdf/components/sidebar/Mindmap'
import AskAIPanel from '@/core/ai/components/AskAIPanel'
import { AI_QUESTION_PROP_ID, AI_SUMMARY_PROP_ID } from '@/api/stores/meta/meta.store'
import Id from '@/utils/id'
import { truncate } from 'lodash'
import { IQuestion } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Trans, useTranslation } from 'react-i18next'
import { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSelectAtomValue } from '@/hooks'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { useUpdate } from 'react-use'
import PDFLabel from '@/core/components/pdf/components/sidebar/Label'

export default memo(({ id }: { id: number }) => {
  const pdfMeta = MetaStore.useObjectToMetaValue(id)
  const [barState, setBarState] = usePDFBarState()
  const instance = usePDFInstance()
  const content = instance.values.texts
  const update = useUpdate()
  useEffect(() => {
    const inter = setInterval(() => {
      update()
    }, 500)
    return () => {
      clearInterval(inter)
    }
  }, [])
  const showSidebar = barState.sidebarActive !== 'hide'
  const doc = useSelectAtomValue(PdfStateAtom, s => s.document)
  const updateDoc = ObjectStore('pdf').updateOne
  const labelIds = useSelectAtomValue(PdfStateAtom, s => s.document?.labels)
  const [onlySummarize, setOnlySummarize] = useState<{
    start?: number
    end?: number
  }>({ start: undefined, end: undefined })

  const [aiOpened, setAiOpened] = useState(false)
  useLayoutEffect(() => {
    if (barState.sidebarActive === 'ai') {
      setAiOpened(true)
    }
  }, [barState])
  const stringContent = useMemo(() => {
    if (aiOpened && content.length) {
      if (onlySummarize.start && onlySummarize.end) {
        const c = content.map(i => ({ id: i.id, text: i.str })).slice(onlySummarize.start - 1, onlySummarize.end)
        return JSON.stringify(c)
      } else {
        return JSON.stringify(content.map(i => ({ id: i.id, text: i.str })))
      }
    }
  }, [aiOpened, content.length, onlySummarize])

  return (
    <Resizable
      defaultSize={{
        width: barState.sidebarWidth,
        height: '100%'
      }}
      onResizeStop={(e, dir, ele) =>
        setBarState(s => ({
          ...s,
          sidebarWidth: ele.getBoundingClientRect().width
        }))
      }
      enable={{
        right: true
      }}
      maxWidth={'50%'}
      minWidth={100}
      style={{
        height: '100%',
        position: showSidebar ? 'relative' : 'absolute',
        left: 0,
        zIndex: showSidebar ? 20 : -1,
        // marginLeft: 5,
        background: Colors.Background.Global,
        borderRight: '1px solid var(--border-background)',
        visibility: showSidebar ? 'visible' : 'hidden'
      }}
    >
      <Tabs defaultActiveKey="thumbnail" activeKey={barState.sidebarActive} disableTabNav>
        <TabPane key="thumbnail">{instance.values.document && <PDFThumbnail />}</TabPane>
        <TabPane key="outline">
          <PdfOutline />
        </TabPane>
        <TabPane key="label" mount>
          {doc && (
            <PDFLabel
              labelIds={labelIds}
              defaultScrollOffset={doc?.labelScrollOffset}
              defaultSortMode={doc?.labelSortMode}
              defaultPriority={doc?.labelPriority}
              onSortModeChange={m => {
                updateDoc({ id: id, labelSortMode: m })
              }}
              onPriorityChange={p => {
                updateDoc({ id: id, labelPriority: p })
              }}
              onOffsetChange={offset => {
                updateDoc({ id: id, labelScrollOffset: offset })
              }}
            />
          )}
        </TabPane>
        <TabPane key="search">
          <PDFSearch />
        </TabPane>
        <TabPane key="mindmap">
          <PDFMindmap id={id} labelIds={labelIds} />
        </TabPane>
        <TabPane key="ai">
          {pdfMeta && stringContent && aiOpened && (
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
                  await Promise.all(newQuestions.map(async i => await ObjectStore('question').addOne({ ...i, parentObjectId: id })))
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
})
