import { IQuestion } from '~/typings'
import { Colors } from '@/consts'
import SimpleEditor from '@/core/components/editor/SimpleEditor'
import { ObjectStore } from '@/api/stores'

export default ({ question, metaId }: { question: IQuestion & { questionType: 'singleSelect' }; metaId?: number }) => {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 13, color: Colors.Font.Transparent, marginTop: 6 }}>输入题目</div>
      <SimpleEditor
        metaId={metaId}
        textareaMode={true}
        containerStyle={{
          minHeight: 110,
          cursor: 'text',
          borderRadius: 6,
          marginTop: 4,
          padding: 8,
          border: '1px solid var(--border-background)'
        }}
        changeOnBlur={true}
        fontSize={15}
        value={question.text}
        onChange={v => {
          ObjectStore('question').updateOne({ id: question.id, text: v })
        }}
      />

      <div style={{ fontSize: 13, color: Colors.Font.Transparent, marginTop: 6 }}>输入回答</div>
      <SimpleEditor
        metaId={metaId}
        textareaMode={true}
        containerStyle={{
          minHeight: 110,
          cursor: 'text',
          borderRadius: 6,
          marginTop: 4,
          padding: 8,
          border: '1px solid var(--border-background)'
        }}
        changeOnBlur={true}
        fontSize={15}
        value={question.answer}
        onChange={v => {
          ObjectStore('question').updateOne({ id: question.id, answer: v })
        }}
      />
    </div>
  )
}
