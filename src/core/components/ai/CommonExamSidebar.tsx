import { memo } from 'react'
import Exam from '@/core/components/exam'
import { IExamQuestion } from '~/typings'

export default memo(
  ({ id, source, currentFocusQuestionId }: { id: number; source?: (question: IExamQuestion) => void; currentFocusQuestionId?: number }) => {
    return (
      <div className={'h-full font-size-13'}>
        <Exam
          explainSource={source}
          initialMode={'test'}
          currentFocusQuestionId={currentFocusQuestionId}
          layout={{
            titleStyle: {
              fontSize: '1rem',
              lineHeight: 1.57,
              marginTop: '0.4em'
            },
            questionGap: m => (m === 'edit' ? undefined : 0),
            pageStyle: m =>
              m === 'edit'
                ? undefined
                : {
                    padding: '0px 0px 24px'
                  },
            headerOnlyModeSwitcher: true,
            title: false
          }}
          id={id}
        />
      </div>
    )
  }
)
