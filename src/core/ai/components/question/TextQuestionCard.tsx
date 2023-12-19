import { IQuestion } from '~/typings'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { ObjectStore } from '@/api/stores'
import { memo, useState } from 'react'
import { ClassName } from 'rendevoz'
import { ContentEditor } from '@/components'
import { Colors } from '@/consts'

export default memo(({ question }: { question: IQuestion & { questionType: 'text' } }) => {
  const [editAnswer, setEditAnswer] = useState(false)
  return (
    <div style={{ width: '100%', cursor: 'pointer' }} onClick={() => setEditAnswer(true)}>
      <div style={{ fontSize: 13, color: Colors.Font.Transparent, marginTop: 6 }}>我的回答</div>
      {editAnswer ? (
        <ContentEditor
          placeholder={'输入答案...'}
          style={{
            marginTop: 4
          }}
          value={question.answer}
          onChange={v => {
            ObjectStore('question').updateOne({ id: question.id, answer: v })
            setEditAnswer(false)
          }}
        />
      ) : (
        <div
          style={{
            fontSize: 14,
            whiteSpace: 'pre-wrap',
            minHeight: 82,
            boxShadow: `0 0 0 1px ${Colors.Background.Border}`,
            marginTop: 3,
            borderRadius: 6,
            padding: '1px 6px'
          }}
        >
          {question.answer}
        </div>
      )}
    </div>
  )
})
