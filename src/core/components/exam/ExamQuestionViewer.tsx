import { MetaStore, ObjectStore } from '@/api/stores'
import ExamQuestionWrapper from '@/core/components/exam/questions/ExamQuestionWrapper'
import { memo } from 'react'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
export default memo(({ id }: { id: number }) => {
  const question = ObjectStore('examQuestion').useValue(id)
  const exam = ObjectStore('exam').useValue(question?.parentObjectId)
  const examMeta = MetaStore.useObjectToMetaValue(exam?.id)
  const { t } = useTranslation()
  if (!question) {
    return null
  }
  if (!exam) {
    return <div className={'w-full h-full transparent-font items-center flex justify-center'}>此考题所在的考卷不存在！</div>
  }
  return (
    <div className={'flex justify-center p-8 w-full h-full overflow-y-auto'}>
      <div
        className={'w-full my-auto'}
        style={{
          maxWidth: 660
        }}
      >
        {examMeta ? (
          <>
            <div className={'px-5 small-transparent pt-6'}>来源于</div>
            <div onClick={() => Global.layoutOps?.openObject(examMeta.id)} className={'cursor-pointer font-medium text-lg px-5'}>
              {examMeta.name || t(trans.Unnamed)}
            </div>
          </>
        ) : null}
        <ExamQuestionWrapper showEditor={false} id={id} />
      </div>
    </div>
  )
})
