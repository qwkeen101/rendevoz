import { memo } from 'react'
import QuestionCard from '@/core/ai/components/question/QuestionCard'

function QuestionDisplayer({ id }: { id: number }) {
  return (
    <QuestionCard
      id={id}
      containerStyle={{
        fontSize: 12
      }}
      styles={{
        contentFontSize: 12,
        smallFontSize: 10
      }}
      display={{
        headBar: false,
        pointers: false,
        from: false,
        title: false
      }}
    />
  )
}

export default memo(QuestionDisplayer)
