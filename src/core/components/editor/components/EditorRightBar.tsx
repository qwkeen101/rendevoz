import { Content, Icon, TabPane, Tabs } from '@/components'
import EditorSearch from '@/core/components/editor/components/EditorSearch'
import { useTranslation } from 'react-i18next'
import useEditorBarState from '../hooks/useEditorBarState'
import { Resizable } from 're-resizable'
import ClassName from '@/styles/classNames'
import EditorLabelController from './EditorLabelController'
import Colors from '@/consts/colors'
import { useEffect, useState, memo, useMemo } from 'react'
import { useSetAtom } from 'jotai'
import { EditorSearchAtom } from '../hooks/useEditorSearch'
import { useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import AskAIPanel from '@/core/ai/components/AskAIPanel'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import normalizeAsAi from '@/core/components/editor/utils/normalizeAsAi'
import { Editor, Node } from 'slate'
import { IQuestion } from '~/typings'
import Id from '@/utils/id'

const EditorRightBar = () => {
  const [barState, setBarState] = useEditorBarState()
  const { t } = useTranslation()
  const instance = useEditorInstance()
  const labels = useSelectAtomValue(EditorStateAtom, s => s.labelIds)
  const labelType = useSelectAtomValue(EditorStateAtom, s => s.labelType) || 'noteLabel'
  const setEditorSearch = useSetAtom(EditorSearchAtom)
  const ai = useSelectAtomValue(EditorStateAtom, s => s.ai)
  useEffect(() => {
    if (!barState.showRightBar || barState.rightBarActive !== 'search') {
      setEditorSearch(s => ({ ...s, isSearching: false }))
    } else if (barState.showRightBar && barState.rightBarActive === 'search') {
      setEditorSearch(s => ({ ...s, isSearching: true }))
    }
  }, [barState])
  const e = instance.getSlateEditor?.()?.children
  const normalized = useMemo(() => {
    if (e) {
      return JSON.stringify(normalizeAsAi(e))
    }
  }, [e])
  const editor = instance.getSlateEditor?.()

  return (
    <Resizable
      enable={{
        left: true
      }}
      defaultSize={{
        width: 380,
        height: '100%'
      }}
      minWidth={380}
      maxWidth={'50%'}
      handleStyles={{
        left: {
          left: 0
        }
      }}
      onResizeStop={(e, d, ele, delta) => {
        setBarState(s => ({ ...s, rightBarWidth: ele.offsetWidth }))
      }}
      style={{
        transform: barState.showRightBar ? 'unset' : 'translateX(100%)',
        background: Colors.Background.Global,
        transition: 'transform 0.27s ease, opacity 0.27s ease',
        position: 'absolute',
        pointerEvents: barState.showRightBar ? 'auto' : 'none',
        borderLeft: `1px solid ${Colors.Background.Border}`,
        opacity: barState.showRightBar ? 1 : 0,
        paddingTop: 32,
        // background: Colors.Background.Secondary,
        right: 0,
        top: 0
      }}
    >
      <Icon
        className={ClassName.flatButton(4, '3px')}
        name={'park-double-right'}
        size={18}
        onClick={() => setBarState(s => ({ ...s, showRightBar: false }))}
        containerStyle={{
          zIndex: 99,
          position: 'absolute',
          left: 5,
          top: 5
        }}
      />
      <Tabs
        tabNavContainerStyle={{
          padding: '6px 8px',
          display: 'none'
        }}
        extra={
          <Icon name="park-right" className={ClassName.circleButton()} onClick={() => setBarState(s => ({ ...s, showRightBar: false }))} />
        }
        defaultActiveKey="search"
        onTabClick={key => setBarState(s => ({ ...s, rightBarActive: key }))}
        activeKey={barState.rightBarActive}
      >
        <TabPane
          key="search"
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-find" />
              {t('general.search')}
            </Content>
          }
        >
          <EditorSearch />
        </TabPane>
        <TabPane
          key="label"
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-label" />
              {t('general.label')}
            </Content>
          }
        >
          <EditorLabelController labelType={labelType} labelIds={labels} />
        </TabPane>
        <TabPane
          key="ai"
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="custom-magic" />
              {t('Ask AI')}
            </Content>
          }
        >
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
        </TabPane>
      </Tabs>
    </Resizable>
  )
}

export default memo(EditorRightBar)
