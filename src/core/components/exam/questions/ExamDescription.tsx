import { IExamDescription } from '~/typings'
import { useExamMode } from '@/core/components/exam/useExamState'
import { ObjectStore } from '@/api/stores'
import { TextEditor } from '@/core'

export default ({ description }: { description: IExamDescription }) => {
  const mode = useExamMode()

  return (
    <div className={'relative'}>
      <TextEditor
        readOnly={mode !== 'edit'}
        defaultValue={description.value}
        placeholder={'请输入描述'}
        onChange={v => {
          ObjectStore('examQuestion').updateOne({ id: description.id, value: v })
        }}
      />
    </div>
  )
}

const isEmptyDesc = (v: any[]) => {
  if (!v.length) return true
  if (v.length === 1) {
    if (v[0].type === 'paragraph' && v[0].children.length === 1 && v[0].children[0].text === '') {
      return true
    }
  }
  return false
}
