import { TabPane, Tabs } from '@/components'
import EditorSearch from '@/core/components/editor/components/sidebar/Search'
import { useTranslation } from 'react-i18next'
import useEditorBarState from '../../hooks/useEditorBarState'
import { Resizable } from 're-resizable'
import EditorLabelController from './Label'
import EditorContents from './Contents'
import Colors from '@/consts/colors'
import { useEffect, memo, useMemo, useRef } from 'react'
import { useSetAtom } from 'jotai'
import { EditorSearchAtom } from '../../hooks/useEditorSearch'
import { useSelectAtomValue, useUpdateEffect } from '@/hooks'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import AskAIPanel from '@/core/ai/components/AskAIPanel'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import normalizeAsAi from '@/core/components/editor/utils/normalizeAsAi'
import { Editor, Node } from 'slate'
import { IQuestion } from '~/typings'
import Id from '@/utils/id'
import { isEqual } from 'lodash'
import CommonAttachmentsSidebar from '@/core/components/common/CommonAttachmentsSidebar'

export default memo(() => {
  const [barState, setBarState] = useEditorBarState()
  const instance = useEditorInstance()
  const { labels, labelType, ai, metaId } = useSelectAtomValue(
    EditorStateAtom,
    s => ({
      labels: s.labelIds,
      labelType: s.labelType,
      ai: s.ai,
      metaId: s.metaId
    }),
    { compare: isEqual }
  )
  const setEditorSearch = useSetAtom(EditorSearchAtom)
  const visible = barState.sidebarActive !== 'hide'
  useUpdateEffect(() => {
    instance.getSlateEditor?.().on({
      type: 'updateNote',
      updater: n => ({ ...n, defaultActiveSidebar: barState.sidebarActive, defaultSidebarWidth: barState.sidebarWidth })
    })
  }, [barState.sidebarActive, barState.sidebarWidth])
  useEffect(() => {
    if (!visible || barState.sidebarActive !== 'search') {
      setEditorSearch(s => ({ ...s, isSearching: false }))
    } else if (visible && barState.sidebarActive === 'search') {
      setEditorSearch(s => ({ ...s, isSearching: true }))
    }
  }, [barState])
  const e = instance.getSlateEditor?.()?.children
  const openAi = useRef(false)
  if (barState.sidebarActive === 'ai') {
    openAi.current === true
  }
  const normalized = useMemo(() => {
    if (barState.sidebarActive !== 'ai' && openAi.current === false) return
    if (e) {
      return JSON.stringify(normalizeAsAi(e))
    }
  }, [e, barState.sidebarActive])
  const editor = instance.getSlateEditor?.()
  return (
    <Resizable
      enable={{
        right: true
      }}
      defaultSize={{
        width: barState.sidebarWidth,
        height: '100%'
      }}
      minWidth={200}
      maxWidth={'50%'}
      onResizeStop={(e, d, ele) => {
        setBarState(s => ({ ...s, sidebarWidth: ele.offsetWidth }))
      }}
      className={'border-right'}
      style={{
        transform: visible ? 'unset' : 'translateX(-100%)',
        background: Colors.Background.Global,
        position: 'absolute',
        pointerEvents: visible ? 'auto' : 'none',
        visibility: visible ? 'visible' : 'hidden',
        zIndex: 999,
        left: 0,
        top: 0
      }}
    >
      <Tabs defaultActiveKey="hide" activeKey={barState.sidebarActive} disableTabNav={true}>
        <TabPane key="search">
          <EditorSearch />
        </TabPane>
        <TabPane key="attachments">{metaId && <CommonAttachmentsSidebar metaId={metaId} />}</TabPane>
        <TabPane key="label" mount>
          <EditorLabelController labelType={labelType} labelIds={labels} />
        </TabPane>
        <TabPane key="contents">
          <EditorContents/>
        </TabPane>
        <TabPane key="ai">
          {(barState.sidebarActive === 'ai' || openAi.current) && normalized && (
            <AskAIPanel
              questions={ai?.questions}
              summary={ai?.summary}
              onSummarized={e => {
                if (!editor) return
                const getBlockStr = (id: number) => {
                  const path = instance.getElementPathById?.(id)
                  if (path) {
                    const n = Editor.node(editor, path)[0]
                    return Node.string(n)
                  }
                }
                const questions: Partial<IQuestion>[] = e.questions
                  .map(i => {
                    if (i.answerType === 'pointer') {
                      return {
                        ...i,
                        answerPointers: i.answerPointers.map(id => ({
                          pointerType: 'documentBlock',
                          blockId: id,
                          blockStr: getBlockStr(id),
                          id: Id.getId()
                        }))
                      } as Partial<IQuestion>
                    }
                  })
                  .filter(i => i) as Partial<IQuestion>[]
                console.log(e, questions)
                editor?.on?.({
                  type: 'AI summarize',
                  ...e,
                  questions
                })
              }}
              on={e => {
                switch (e.type) {
                  case 'questionGotoOriginalPlace': {
                    instance.scrollToBlock?.({
                      blockId: e.originalId,
                      highlight: true
                    })
                    return true
                  }
                  case 'getOriginalText': {
                    const editor = instance.getSlateEditor?.()
                    const path = instance.getElementPathById?.(e.originalId)
                    if (path && editor) {
                      const node = Editor.node(editor, path)
                      if (node) {
                        return Node.string(node[0])
                      }
                    }
                  }
                }
              }}
              content={normalized}
            />
          )}
        </TabPane>
      </Tabs>
    </Resizable>
  )
})
