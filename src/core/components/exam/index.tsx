import { CSSProperties, memo, useEffect, useMemo, useRef } from 'react'
import ExamHeader from '@/core/components/exam/ExamHeader'
import './index.less'
import { AnimatePopover, Icon } from '@/components'
import { Icons } from '@/consts'
import { MetaStore, ObjectStore } from '@/api/stores'
import { IExamInstance, IExamQuestion } from '~/typings'
import ExamQuestionsContainer from '@/core/components/exam/ExamQuestionsContainer'
import useExamInstance, { assignExamInstance } from '@/core/components/exam/useExamInstance'
import ExamQuestionTypeChooser from '@/core/components/exam/ExamQuestionTypeChooser'
import ExamHeaderBar from '@/core/components/exam/ExamHeaderBar'
import useExamState, { calculateHistoryQuestions, ExamStateAtom } from '@/core/components/exam/useExamState'
import ExamHistoryViewer from '@/core/components/exam/ExamHistoryViewer'
import ExamQuestionWithHistoryViewer from '@/core/components/exam/ExamQuestionWithHistoryViewer'
import produce from 'immer'
import { createStore, Provider } from 'jotai'
import { useTranslation } from 'react-i18next'

type IExamProps = {
  id: number
  onInstanceInitialized?: (i: IExamInstance) => void
  currentFocusQuestionId?: number
  layout?: {
    headerOnlyModeSwitcher?: boolean
    title?: boolean
    titleStyle?: CSSProperties
    questionGap?: (mode: 'test' | 'edit' | 'history' | 'display') => number | undefined
    pageStyle?: (mode: 'test' | 'edit' | 'history' | 'display') => CSSProperties | undefined
  }
  explainSource?: (question: IExamQuestion) => void
  initialMode?: 'edit' | 'test'
}

const InnerExam = memo(({ id, onInstanceInitialized, layout, explainSource, currentFocusQuestionId }: IExamProps) => {
  const exam = ObjectStore('exam').useValue(id)
  const examMeta = MetaStore.useObjectToMetaValue(id)
  const [{ mode, currentHistory, currentViewingQuestionWithHistory, historyVisible }, setState] = useExamState()
  const instance = useExamInstance()
  const { t } = useTranslation()
  const scrollElementRef = useRef<HTMLDivElement>(null)
  instance.scrollElementRef = scrollElementRef
  assignExamInstance(instance, id)
  useEffect(() => {
    setState(s => ({ ...s, explainSource, currentFocusQuestionId }))
  }, [explainSource, currentFocusQuestionId])
  useEffect(() => {
    if (exam?.history?.length) {
      ObjectStore('examQuestion')
        .getMultipleByIds(exam.questions)
        .then(res => {
          setState(s => ({ ...s, categorizedQuestions: calculateHistoryQuestions(exam.history!, res) }))
        })
    }
  }, [exam?.history])
  useEffect(() => {
    onInstanceInitialized?.(instance)
  }, [])
  useEffect(() => {
    ObjectStore('examQuestion')
      .getMultipleByIds(exam?.questions || [])
      .then(res => {
        setState(s => ({ ...s, allQuestions: res }))
      })
  }, [exam?.questions])

  if (!exam) return null
  const render = () => {
    if (historyVisible && layout?.headerOnlyModeSwitcher && !currentViewingQuestionWithHistory && !currentHistory) {
      return <ExamHistoryViewer listMode history={exam.history} />
    }
    if (currentViewingQuestionWithHistory) {
      return <ExamQuestionWithHistoryViewer id={exam.id} />
    }
    return (
      <div
        style={{
          paddingBottom: layout?.headerOnlyModeSwitcher ? 24 : '10rem',
          ...layout?.pageStyle?.(mode)
        }}
        ref={scrollElementRef}
        className={'flex-1 h-full overflow-y-auto px-6'}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 680,
            marginTop: layout?.headerOnlyModeSwitcher ? (mode === 'edit' ? 12 : 0) : '3rem'
          }}
          className={'mx-auto flex flex-col items-center'}
        >
          {layout?.title !== false && (
            <ExamHeader
              onChange={v => {
                if (examMeta) {
                  MetaStore.updateMetaObject({ id: examMeta.id, name: v })
                }
              }}
              onHistoryCommentChange={(id, v) => {
                ObjectStore('exam').updateOne({
                  id: exam.id,
                  history: produce(exam.history || [], draft => {
                    const item = draft.find(o => o.id === id)
                    if (item) {
                      item.comment = v
                    }
                  })
                })
              }}
              name={examMeta?.name}
            />
          )}
          <ExamQuestionsContainer
            questionGap={layout?.questionGap?.(mode)}
            titleStyle={layout?.titleStyle}
            onChange={v => {
              ObjectStore('exam').updateOne({ id: exam.id, questions: v })
            }}
            ids={exam.questions}
          />
          {mode === 'edit' && (
            <div className={'w-full flex justify-center mt-6'}>
              <AnimatePopover
                positions={['top', 'bottom']}
                padding={6}
                content={setV => (
                  <ExamQuestionTypeChooser
                    onChange={i => {
                      instance.addQuestion({ type: i, direction: 'after' })
                      setV(false)
                    }}
                  />
                )}
              >
                <Icon strokeWidth={3.5} size={18} name={Icons.Create} className={'exam-plus-button'} />
              </AnimatePopover>
            </div>
          )}
          {mode === 'test' && (
            <div
              onClick={() => {
                instance.submit()
              }}
              className={'select-button mt-12 !px-24 !py-2'}
            >
              {t('exam.Submit')}
            </div>
          )}
          {mode === 'edit' && (
            <div
              onClick={() => {
                setState(s => ({ ...s, mode: 'test' }))
              }}
              className={'select-button mt-6 !px-24 !py-2'}
            >
              {t('exam.Start exam')}
            </div>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className={'h-full flex flex-col w-full overflow-hidden'}>
      <ExamHeaderBar switcherMode={layout?.headerOnlyModeSwitcher} name={examMeta?.name} />
      {layout?.headerOnlyModeSwitcher !== true ? (
        <div className={'flex flex-1 max-h-full'}>
          {render()}
          <ExamHistoryViewer history={exam.history} />
        </div>
      ) : (
        render()
      )}
    </div>
  )
})

export default memo(({ id, onInstanceInitialized, layout, initialMode, explainSource, currentFocusQuestionId }: IExamProps) => {
  const store = useMemo(() => {
    const s = createStore()
    const currentState = s.get(ExamStateAtom)
    s.set(ExamStateAtom, { ...currentState, mode: initialMode ?? 'edit' })
    return s
  }, [])
  return (
    <Provider store={store}>
      <InnerExam
        explainSource={explainSource}
        layout={layout}
        id={id}
        currentFocusQuestionId={currentFocusQuestionId}
        onInstanceInitialized={onInstanceInitialized}
      />
    </Provider>
  )
})
