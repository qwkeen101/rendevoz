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
        smallFontSize: 10,
        titleFontSize: 13
      }}
      autoFocus={false}
      display={{
        headBar: false,
        pointers: false,
        from: false
      }}
    />
  )
}

export default memo(QuestionDisplayer)
