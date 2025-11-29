import Exam from '@/core/components/exam'
import { MetaStore } from '@/api/stores'
import { Icon, TabTitle } from '@/components'
import { IExamInstance } from '~/typings'

export default ({ id, onInstanceInitialized }: { id: number; onInstanceInitialized?: (i: IExamInstance) => void }) => {
  const m = MetaStore.useObjectToMetaValue(id)
  return (
    <>
      <Exam onInstanceInitialized={onInstanceInitialized} id={id} />
      <TabTitle title={m?.name} icon={<Icon name={Global.utils.getIcon('exam')} size={16} />} />
    </>
  )
}
