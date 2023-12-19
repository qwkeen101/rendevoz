import { IWhiteboardInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { transformXY } from '@/core/components/whiteboard/utils'

const assignCoordOps = (instance: IWhiteboardInstance) => {
  assignProperties(instance, {
    coordOps: {
      transformWhiteboardPositionToWindowPosition: e => {
        const container = instance.getContainerNode?.()
        const transform = instance.getTransform?.()
        if (container && transform) {
          const bounding = container.getBoundingClientRect()
          return {
            x: e.x * transform.scale + bounding.x,
            y: e.y * transform.scale + bounding.y
          }
        } else {
          throw new Error('Failed to transform coordinate!')
        }
      },
      transformWindowPositionToPosition: e => {
        const container = instance.getContainerNode?.()
        const transform = instance.getTransform?.()
        if (container && transform) {
          return transformXY(container.getBoundingClientRect(), e.x, e.y, transform.scale)
        } else {
          throw new Error('Failed to transform coordinate!')
        }
      }
    }
  })
}

export default assignCoordOps
