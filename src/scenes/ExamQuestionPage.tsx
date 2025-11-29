import ExamQuestionViewer from '@/core/components/exam/ExamQuestionViewer'
import { MetaStore } from '@/api/stores'
import { Icon, TabTitle } from '@/components'

export default ({ id }: { id: number }) => {
  const m = MetaStore.useObjectToMetaValue(id)
  return (
    <>
      <ExamQuestionViewer id={id} />
      <TabTitle title={m?.name} icon={<Icon size={16} name={Global.utils.getIcon('examQuestion')} />} />
    </>
  )
}
