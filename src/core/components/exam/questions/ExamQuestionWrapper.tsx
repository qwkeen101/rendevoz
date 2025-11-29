import { CSSProperties, memo, useEffect, useRef, useState } from 'react'
import { AutosizeTextarea, ContentEditor, Icon, IconWithPopover, Menu, WithBorder } from '@/components'
import ExamTextQuestion from '@/core/components/exam/questions/ExamTextQuestion'
import ExamSingleSelectQuestion from '@/core/components/exam/questions/ExamSingleSelectQuestion'
import ExamMultiSelectQuestion from '@/core/components/exam/questions/ExamMultiSelectQuestion'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Icons } from '@/consts'
import { motion, AnimatePresence } from 'framer-motion'
import useExamInstance from '@/core/components/exam/useExamInstance'
import ExamClozeQuestion from '@/core/components/exam/questions/ExamClozeQuestion'
import ExamImageOcclusionQuestion from '@/core/components/exam/questions/ExamImageOcclusionQuestion'
import ExamTofQuestion from '@/core/components/exam/questions/ExamTofQuestion'
import ExamNumberQuestion from '@/core/components/exam/questions/ExamNumberQuestion'
import ExamDateQuestion from '@/core/components/exam/questions/ExamDateQuestion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useExamExplainSource, useExamFocusQuestion, useExamMode } from '@/core/components/exam/useExamState'
import classnames from 'classnames'
import { IExamQuestion } from '~/typings'
import ExamDescription from '@/core/components/exam/questions/ExamDescription'
import { useTranslation } from 'react-i18next'
import { TYPE_TO_QUESTION_NAME } from '@/core/components/exam/consts'
import trans from '@/consts/trans'
import addExamQuestionAsMeta from '@/core/components/exam/addExamQuestionAsMeta'
import toast from 'react-hot-toast'
import TextEditor from '@/core/components/editor/TextEditor'
import { scrollToTarget } from '@/core/components/editor/utils/positions/scroll'

export default memo(
  ({
    id,
    showAdd,
    onAdd,
    idx,
    onComment,
    className,
    onViewHistory,
    showEditor = true,
    time,
    onViewExam,
    question: outerQuestion,
    titleStyle
  }: {
    id: number
    showAdd?: boolean
    showEditor?: boolean
    onAdd?: () => void
    idx?: number
    question?: IExamQuestion
    time?: number
    onComment?: (c: string | null, id?: number) => void
    className?: string
    onViewExam?: VoidFunction
    onViewHistory?: VoidFunction
    titleStyle?: CSSProperties
  }) => {
    const question = outerQuestion || ObjectStore('examQuestion').useValue(id)
    const questionMeta = MetaStore.useObjectToMetaValue(question?.id)
    const name = questionMeta?.name ?? question?.name
    const { t } = useTranslation()
    const mode = useExamMode()
    const source = useExamExplainSource()
    const currentFocus = useExamFocusQuestion()
    const containerRef = useRef<HTMLDivElement>(null)
    const instance = useExamInstance()
    const [testShowAnswer, setTestShowAnswer] = useState(false)
    const [showComment, setShowComment] = useState(false)
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
      id
    })
    const style = {
      transform: CSS.Transform.toString(
        transform
          ? {
              x: transform?.x ?? 0,
              y: transform?.y ?? 0,
              scaleX: 1,
              scaleY: 1
            }
          : null
      ),
      zIndex: isDragging ? 10 : undefined
    }
    useEffect(() => {
      if (currentFocus === question?.id) {
        const current = containerRef.current
        const parent = instance.scrollElementRef.current
        if (current && parent) {
          scrollToTarget(current, parent)
        }
      }
    }, [currentFocus])
    if (!question) return null
    const renderChildren = () => {
      const showAnswer = mode === 'test' && testShowAnswer
      switch (question.type) {
        case 'description':
          return <ExamDescription description={question} />
        case 'imageOcclusion':
          return <ExamImageOcclusionQuestion question={question} />
        case 'cloze':
          return <ExamClozeQuestion showAnswer={showAnswer} question={question} />
        case 'multiSelect':
          return <ExamMultiSelectQuestion showAnswer={showAnswer} question={question} />
        case 'singleSelect':
          return <ExamSingleSelectQuestion showAnswer={showAnswer} question={question} />
        case 'trueOrFalse':
          return <ExamTofQuestion showAnswer={showAnswer} question={question} />
        case 'date':
          return <ExamDateQuestion showAnswer={showAnswer} question={question} />
        case 'location':
          return
        case 'number':
          return <ExamNumberQuestion showAnswer={showAnswer} question={question} />
        case 'text':
          return <ExamTextQuestion showAnswer={showAnswer} question={question} />
      }
    }
    if (mode === 'display') {
      return (
        <>
          {question.description && !isEmptyDesc(question.description) && (
            <TextEditor className={'exam-question-desc-displayer'} fontSize={11} defaultValue={question.description} placeholder={''} />
          )}
          <div className={'em:mt-2 w-full'}>{renderChildren()}</div>
        </>
      )
    }
    if (mode === 'test' || mode === 'history') {
      const hasDesc = question.description && !isEmptyDesc(question.description)
      return (
        <div
          ref={containerRef}
          className={classnames(
            'exam-question-wrapper !rounded-none flex-col w-full test group',
            className,
            currentFocus === question.id && 'select-color-super-transparent-bg'
          )}
        >
          {mode === 'history' && question.type !== 'description' && (
            <div
              style={{
                fontSize: '0.93em'
              }}
              className={classnames('flex justify-between items-center em:gap-2.5 transparent-font w-full', time ? 'em:mb-2' : '')}
            >
              <div className={'flex'}>
                {!time ? (
                  <>
                    <div>{t(TYPE_TO_QUESTION_NAME[question.type])}</div>
                  </>
                ) : null}
                {time ? (
                  <>
                    <div>{DateFormat.formatTime(time)}</div>
                  </>
                ) : null}
              </div>
              <IconWithPopover
                name={Icons.More}
                style={{
                  fontSize: '1.5em'
                }}
                className={'hover-active-button'}
                placement={['bottom', 'top']}
                content={setV => (
                  <WithBorder className={'popover-menu-mid'}>
                    <Menu.NavigationMenu
                      layout={[
                        {
                          type: 'item',
                          key: 'comment',
                          icon: 'park-comment',
                          onSelect: () => {
                            setV(false)
                            setShowComment(!showComment)
                          },
                          text: t('review.Add a comment')
                        },
                        time
                          ? {
                              type: 'item',
                              key: 'exam',
                              icon: 'park-notes',
                              onSelect: () => {
                                setV(false)
                                onViewExam?.()
                              },
                              text: '查看考卷'
                            }
                          : {
                              type: 'item',
                              key: 'anaylistic',
                              icon: 'park-history',
                              onSelect: () => {
                                setV(false)
                                onViewHistory?.()
                              },
                              text: '答题历史'
                            },
                        {
                          type: 'item',
                          key: 'link',
                          icon: Icons.Link,
                          text: t(trans.CopyLink),
                          onSelect: () => {
                            addExamQuestionAsMeta(question.id).then(res => {
                              Global.metaOps.copyLink(res.id)
                            })
                            setV(false)
                          }
                        }
                      ]}
                    />
                  </WithBorder>
                )}
              ></IconWithPopover>
            </div>
          )}
          {mode === 'test' && idx !== undefined && question.type !== 'description' && (
            <div
              style={{
                fontSize: '0.93em'
              }}
              className={'flex justify-between items-center em:gap-2.5 transparent-font w-full'}
            >
              <div>
                {idx + 1}. {t(TYPE_TO_QUESTION_NAME[question.type])}
              </div>
              <div
                style={{
                  fontSize: '1.2em'
                }}
                className={'flex gap-4'}
              >
                {source && (
                  <Icon className={'hover-active-button'} tooltip={'Chat'} onClick={() => source(question)} name={'custom-stars'} />
                )}
                <Icon
                  tooltip={'Show answer'}
                  className={classnames(testShowAnswer ? 'select-color-font cursor-pointer' : 'hover-active-button')}
                  onClick={() => setTestShowAnswer(!testShowAnswer)}
                  name={testShowAnswer ? 'park-preview-open' : 'park-preview-close'}
                />
              </div>
            </div>
          )}
          <div data-no-dnd className={'cursor-auto w-full'}>
            {question.type !== 'description' && time === undefined ? (
              <>
                <AutosizeTextarea
                  style={titleStyle}
                  disabled
                  value={name}
                  className={classnames('font-bold em:text-2xl cursor-text', hasDesc ? '' : 'mb-3')}
                  placeholder={t('exam.Question name')}
                />
                {hasDesc && (
                  <div className={'transparent-font relative cursor-text mb-3'}>
                    <TextEditor readOnly defaultValue={question.description} />
                  </div>
                )}
              </>
            ) : null}
            {renderChildren()}
            {mode === 'history' && question.comment?.length ? (
              <div className={'flex flex-col gap-3 mt-5'}>
                {question.comment?.map(i => (
                  <CommentRenderer
                    comment={i}
                    key={i.id}
                    onChange={v => {
                      onComment?.(v ?? '', i.id)
                    }}
                    onDelete={() => {
                      onComment?.(null, i.id)
                    }}
                  />
                ))}
              </div>
            ) : null}
            {showComment && (
              <ContentEditor
                onChange={v => {
                  onComment?.(v)
                }}
                placeholder={t('review.Add a comment')}
                key={question.comment?.length ?? 0}
                className={'!rounded-none mt-3 !py-2 !pl-0'}
                style={{
                  boxShadow: 'none',
                  fontSize: '1rem'
                }}
              />
            )}
          </div>
        </div>
      )
    }
    return (
      <div
        {...attributes}
        {...listeners}
        style={style}
        ref={n => {
          setNodeRef(n)
          containerRef.current = n
        }}
        className={'relative w-full'}
        id={id.toString()}
      >
        <AnimatePresence>
          {showAdd && (
            <motion.div data-no-dnd transition={{ duration: 0.12 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Icon
                strokeWidth={3.5}
                size={18}
                onClick={onAdd}
                name={Icons.Create}
                className={'exam-plus-button rotate'}
                style={{
                  position: 'absolute',
                  top: -12,
                  left: -6,
                  borderRadius: '100% 100% 6px',
                  transform: 'translate(-100%, -50%) rotate(-45deg)'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div
          style={{
            boxShadow: showEditor ? undefined : 'none'
          }}
          className={classnames('exam-question-wrapper group', currentFocus === question.id && 'select-color-super-transparent-bg')}
        >
          <div className={'font-medium font-size-13 transparent-font'}>{t(TYPE_TO_QUESTION_NAME[question.type])}</div>
          {showEditor && (
            <div className={'opacity-0 z-20 transparent-font group-hover:opacity-100 exam-more-icon'}>
              <Icon
                name={questionMeta ? Icons.Info : Icons.AddAsObject}
                tooltip={!questionMeta ? t(trans.Meta.AddAsObject) : t(trans.Meta.ViewDetails)}
                onClick={() => {
                  if (questionMeta) {
                    Global.metaOps.openDetails?.(questionMeta.id)
                  } else {
                    addExamQuestionAsMeta(question.id).then(res => {
                      toast.success(t(trans.Success.AddedSuccessfully))
                    })
                  }
                }}
                size={16}
                data-no-dnd
                className={'square-button'}
              />
              <Icon
                name={Icons.Copy}
                tooltip={t(trans.CopyLink)}
                onClick={() => {
                  addExamQuestionAsMeta(question.id).then(res => {
                    Global.metaOps.copyLink(res.id)
                  })
                }}
                size={16}
                data-no-dnd
                className={'square-button'}
              />
              <Icon
                tooltip={t(trans.Delete)}
                name={Icons.Delete}
                onClick={() => instance.deleteQuestion(id)}
                size={16}
                data-no-dnd
                className={'square-button'}
              />
            </div>
          )}
          <div data-no-dnd className={'flex-1 w-full cursor-auto'}>
            {question.type !== 'description' && (
              <>
                <AutosizeTextarea
                  value={name}
                  style={titleStyle}
                  onChange={e => {
                    if (questionMeta) {
                      MetaStore.updateMetaObject({ id: questionMeta.id, name: e })
                    } else {
                      ObjectStore('examQuestion').updateOne({ id: question.id, name: e })
                    }
                  }}
                  className={'font-bold em:text-2xl cursor-text'}
                  placeholder={t('exam.Question name')}
                />
                <div className={'transparent-font relative cursor-text em:mb-3'}>
                  <TextEditor
                    defaultValue={question.description}
                    placeholder={t('exam.Type question description')}
                    onChange={v => {
                      ObjectStore('examQuestion').updateOne({ id, description: v })
                    }}
                  />
                </div>
              </>
            )}
            {renderChildren()}
          </div>
        </div>
      </div>
    )
  }
)

const isEmptyDesc = (v: any[]) => {
  if (!v.length) return true
  if (v.length === 1) {
    if (v[0].type === 'paragraph' && v[0].children.length === 1 && v[0].children[0].text === '') {
      return true
    }
  }
  return false
}

const CommentRenderer = ({
  comment,
  onDelete,
  onChange
}: {
  comment: Required<IExamQuestion>['comment'][0]
  onChange: (v: string) => void
  onDelete: VoidFunction
}) => {
  const [isEditing, setIsEditing] = useState(false)
  return (
    <div className={'relative group/comment'}>
      {!isEditing && (
        <WithBorder
          className={
            'absolute p-0.5 !rounded-md transparent-font top-0 right-0 flex opacity-0 group-hover/comment:opacity-100 transition-opacity'
          }
        >
          <Icon name={Icons.Edit} strokeWidth={4} onClick={() => setIsEditing(true)} className={'square-button'} size={15} />
          <Icon name={Icons.Delete} strokeWidth={4} onClick={onDelete} className={'square-button'} size={15} />
        </WithBorder>
      )}
      <div className={'small-transparent'}>{DateFormat.formatTime(comment.time)}</div>
      {isEditing ? (
        <ContentEditor
          onChange={v => {
            onChange?.(v)
            setIsEditing(false)
          }}
          value={comment.text}
          className={'!rounded-none !py-2 !pl-0'}
          style={{
            boxShadow: 'none',
            fontSize: '1rem'
          }}
        />
      ) : (
        <div className={'whitespace-pre-wrap'}>{comment.text}</div>
      )}
    </div>
  )
}
