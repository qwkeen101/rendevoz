import { MetaObject } from '~/typings'
import { IconNameRenderer } from '@/core'

export default ({ value }: { value: MetaObject['type'] }) => {
  return <IconNameRenderer gap={8} name={Global.utils.getTypeName(value)} icon={Global.utils.getIcon(value)}></IconNameRenderer>
}
