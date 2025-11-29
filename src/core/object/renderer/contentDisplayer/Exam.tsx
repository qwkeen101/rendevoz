import { ObjectStore } from '@/api/stores'
import { useMemo } from 'react'
import { TYPE_TO_QUESTION_NAME } from '@/core/components/exam/consts'
import { useTranslation } from 'react-i18next'
import { EmptyCard } from '@/core/components'
import trans from '@/consts/trans'
const ExamDisplayer = ({ id }: { id?: number }) => {
  const { t } = useTranslation()
  const exam = ObjectStore('exam').useValue(id)
  const questions = ObjectStore('examQuestion').useMultiple(exam?.questions)
  const validQuestions = useMemo(() => {
    return questions.filter(i => i.type !== 'description')
  }, [questions])
  if (validQuestions.length) {
    return (
      <div className={'flex flex-col p-3 font-size-12 gap-0.5'}>
        {validQuestions.map((i, idx) => (
          <div key={i.id}>
            {idx + 1}. {t(TYPE_TO_QUESTION_NAME[i.type])} - {i.name || t(trans.Unnamed)}
          </div>
        ))}
      </div>
    )
  }
  return <EmptyCard />
}

export default ExamDisplayer
