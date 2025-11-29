import { memo, useMemo } from 'react'
import useExamState from '@/core/components/exam/useExamState'
import { useTranslation } from 'react-i18next'
import { TYPE_TO_QUESTION_NAME } from '@/core/components/exam/consts'
import trans from '@/consts/trans'
import classnames from 'classnames'
import { compareStrings } from '@/utils'
import { EmptyList } from '@/core/components'

export default memo(() => {
  const [{ categorizedQuestions, questionHistorySort, allQuestions }, setState] = useExamState()
  const { t } = useTranslation()
  const sortMode = questionHistorySort ?? 'wrong'
  const sorted = useMemo(() => {
    if (categorizedQuestions) {
      return Object.values(categorizedQuestions).toSorted((a, b) => {
        if (sortMode === 'wrong') {
          return b.wrong - a.wrong
        }
        if (sortMode === 'correct') {
          return b.correct - a.correct
        }
        if (sortMode === 'name') {
          return compareStrings(a.question.name, b.question.name)
        }
        const ids = allQuestions?.map(i => i.id) || []
        return ids.indexOf(a.question.id) - ids.indexOf(b.question.id)
      })
    }
  }, [categorizedQuestions, sortMode, allQuestions])
  if (!sorted?.length) {
    return <EmptyList className={'h-full'} />
  }
  return (
    <div>
      {sorted?.map((i, idx) => (
        <div
          onClick={() => setState(s => ({ ...s, currentViewingQuestionWithHistory: i, mode: 'history' }))}
          className={classnames(
            'flex flex-col p-3.5 cursor-pointer light-hover transition-colors',
            idx !== sorted.length - 1 && 'border-bottom'
          )}
          key={i.question.id}
        >
          <div className={'small-transparent flex gap-1 items-center'}>
            <div>{t(TYPE_TO_QUESTION_NAME[i.question.type])}</div>
            <div className={'leading-none'}>•</div>
            <div>
              {sortMode === 'wrong' ? '错误' : '正确'}
              <span className={'font-medium mx-0.5'}>{sortMode === 'wrong' ? i.wrong : i.correct}</span>次
            </div>
          </div>
          <div className={classnames(!i.question.name ? 'super-transparent-font' : '', 'font-medium mt-0.5')}>
            {i.question.name || t(trans.Unnamed)}
          </div>
        </div>
      ))}
    </div>
  )
})
