import { IWhiteboardInstance } from '~/typings'
import { assignProperties } from '@/utils'

export default function assignLineOps(instance: IWhiteboardInstance) {
  assignProperties(instance, {
    edgeOps: {}
  })
}
